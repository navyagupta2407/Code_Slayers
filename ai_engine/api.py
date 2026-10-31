import secrets

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from starlette.concurrency import run_in_threadpool

from ai_engine.inference_service import analyze_report, MAX_IMAGE_SIZE

router = APIRouter()


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    report_id: str = Form(None),
    description: str = Form(""),
    claimed_location: str = Form(None),
    authorization: str = Header(None)
):
    if not file:
        raise HTTPException(status_code=400, detail="Image file is required")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the maximum size of 10 MB."
        )

    try:
        result = await run_in_threadpool(
            analyze_report,
            image_bytes,
            description,
            claimed_location
        )

        result["analysis_status"] = "completed"
        result["submission_id"] = report_id or secrets.token_hex(8)

        return result

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="AI analysis failed."
        )
