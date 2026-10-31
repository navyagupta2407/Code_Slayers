from pathlib import Path
from io import BytesIO
import logging
import tempfile
import uuid

from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from starlette.concurrency import run_in_threadpool

from ai_engine.evidence_engine import analyze_evidence
from ai_engine.image_registry import (
    load_image_registry,
    register_image
)

app = FastAPI(
    title="SATYAMAP AI API",
    description="Crowdsourced Extreme Weather Verification and GIS De-Duplicator",
    version="1.3.0"
)

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


def sanitize_image_paths(data, filename):
    if isinstance(data, dict):
        return {
            key: filename if key == "image_path"
            else sanitize_image_paths(value, filename)
            for key, value in data.items()
        }

    if isinstance(data, list):
        return [sanitize_image_paths(item, filename) for item in data]

    return data


@app.get("/")
def home():
    return {
        "project": "SATYAMAP AI",
        "message": "AI Evidence Analysis API is running",
        "status": "active"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "SATYAMAP AI"}


@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    claimed_location: str = Form(default=None)
):
    filename = Path(file.filename or "uploaded_image").name
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Unsupported image format.")

    temp_path = None

    try:
        contents = await file.read(MAX_UPLOAD_SIZE + 1)

        if not contents:
            raise HTTPException(400, "Uploaded file is empty.")

        if len(contents) > MAX_UPLOAD_SIZE:
            raise HTTPException(413, "Image exceeds the maximum upload size of 10 MB.")

        try:
            with Image.open(BytesIO(contents)) as image:
                image.verify()
        except (UnidentifiedImageError, OSError, ValueError):
            raise HTTPException(400, "Uploaded file is not a valid image.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            temp_file.write(contents)
            temp_path = Path(temp_file.name)

        existing_images = await run_in_threadpool(load_image_registry)

        result = await run_in_threadpool(
            analyze_evidence,
            image_path=temp_path,
            existing_images=existing_images,
            claimed_location=claimed_location
        )

        duplicate_result = result.get("duplicate_detection", {})
        duplicate_detected = duplicate_result.get("duplicate_detected", False)

        if duplicate_detected and duplicate_result.get("matches"):
            submission_id = str(duplicate_result["matches"][0]["report_id"])
            duplicate_result["new_image_registered"] = False
        else:
            submission_id = str(uuid.uuid4())
            await run_in_threadpool(register_image, temp_path, submission_id)
            duplicate_result["new_image_registered"] = True

        result = sanitize_image_paths(result, filename)
        result["submission_id"] = submission_id
        result["duplicate_detection"]["registry_size"] = (
            len(existing_images) if duplicate_detected else len(existing_images) + 1
        )

        return result

    except HTTPException:
        raise
    except Exception:
        logger.exception("SATYAMAP AI image analysis failed")
        raise HTTPException(500, "Image analysis failed. Please try again.")
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()
        await file.close()
