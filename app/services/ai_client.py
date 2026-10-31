import httpx
from app.config import settings


async def analyze_report(
    image_bytes: bytes,
    filename: str,
    content_type: str,
    description: str,
    latitude: float,
    longitude: float,
    report_id: str
):
    if not settings.ai_service_url:
        return {
            "status": "not_configured",
            "requires_human_review": True,
            "message": "AI service URL is not configured"
        }

    headers = {}

    if settings.ai_service_token:
        headers["Authorization"] = (
            f"Bearer {settings.ai_service_token}"
        )

    files = {
        "file": (filename, image_bytes, content_type)
    }

    data = {
        "report_id": report_id,
        "description": description,
        "claimed_location": f"{latitude},{longitude}"
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{settings.ai_service_url.rstrip('/')}/analyze",
            headers=headers,
            files=files,
            data=data
        )

        response.raise_for_status()
        return response.json()
