
from pathlib import Path
from io import BytesIO
import tempfile
import logging

from PIL import Image, UnidentifiedImageError

from ai_engine.evidence_engine import analyze_evidence


logger = logging.getLogger(__name__)

MAX_IMAGE_SIZE = 10 * 1024 * 1024

ALLOWED_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}


def analyze_report(
    image_bytes: bytes,
    description: str,
    claimed_location: str = None,
    existing_images=None
) -> dict:
    """
    Backend-compatible SATYAMAP AI inference interface.

    Accepts image bytes and runs the existing evidence pipeline.

    Description is accepted for backend compatibility but is
    not currently used by the image-only classification model.

    Returns a JSON-compatible evidence analysis dictionary.
    """

    if not isinstance(image_bytes, bytes) or not image_bytes:
        raise ValueError("Image data must be non-empty bytes.")

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise ValueError("Image exceeds the maximum size of 10 MB.")

    if existing_images is None:
        existing_images = {}

    temp_path = None

    try:
        # 1. Validate actual image content

        try:
            with Image.open(BytesIO(image_bytes)) as image:
                image_format = image.format

                if image_format not in ALLOWED_FORMATS:
                    raise ValueError(
                        "Unsupported image format. "
                        "Use JPEG, PNG or WebP."
                    )

                image.verify()

        except (UnidentifiedImageError, OSError) as exc:
            raise ValueError("Uploaded data is not a valid image.") from exc

        # 2. Create temporary image file

        extension = ALLOWED_FORMATS[image_format]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            temp_file.write(image_bytes)
            temp_path = Path(temp_file.name)

        # 3. Run existing AI evidence pipeline

        result = analyze_evidence(
            image_path=temp_path,
            existing_images=existing_images,
            claimed_location=claimed_location
        )

        # 4. Remove internal temporary path from response

        result["image_path"] = f"uploaded_image{extension}"

        # 5. Include model input context

        result["input_context"] = {
            "description_received": bool(description),
            "description_used_for_prediction": False
        }

        return result

    except Exception:
        logger.exception("SATYAMAP AI inference failed")
        raise

    finally:
        # 6. Always remove temporary image

        if temp_path and temp_path.exists():
            temp_path.unlink()
