import asyncio
import logging
import tempfile
from pathlib import Path

from starlette.concurrency import run_in_threadpool

from app.database import supabase
from ai_engine.inference_service import analyze_report
from ai_engine.image_registry import load_image_registry, register_image

logger = logging.getLogger(__name__)

BUCKET = "report-media"

EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


async def process_report(report_id: str):
    temp_path = None

    try:
        # Mark report as processing
        supabase.table("reports").update({
            "processing_status": "processing"
        }).eq("id", report_id).execute()

        # Fetch report
        report_response = (
            supabase.table("reports")
            .select("*")
            .eq("id", report_id)
            .single()
            .execute()
        )

        report = report_response.data

        # Fetch uploaded media
        media_response = (
            supabase.table("report_media")
            .select("*")
            .eq("report_id", report_id)
            .execute()
        )

        media = media_response.data or []

        if not media:
            supabase.table("reports").update({
                "processing_status": "queued"
            }).eq("id", report_id).execute()

            return {"status": "waiting_for_media"}

        # Download first uploaded image
        first_media = media[0]

        image_bytes = supabase.storage.from_(BUCKET).download(
            first_media["storage_path"]
        )

        if not isinstance(image_bytes, bytes):
            image_bytes = bytes(image_bytes)

        content_type = first_media["media_type"]
        extension = EXTENSIONS.get(content_type)

        if not extension:
            raise ValueError(f"Unsupported media type: {content_type}")

        # Load existing perceptual hashes
        existing_images = await run_in_threadpool(
            load_image_registry
        )

        # Convert claimed coordinates into the format expected by AI
        latitude = report.get("latitude")
        longitude = report.get("longitude")

        claimed_location = None
        if latitude is not None and longitude is not None:
            claimed_location = f"{latitude},{longitude}"

        # Run AI inference directly, without HTTP
        result = await run_in_threadpool(
            analyze_report,
            image_bytes,
            report.get("description", ""),
            claimed_location,
            existing_images
        )

        # Register new images, but never register detected duplicates
        duplicate_result = result.get("duplicate_detection", {})
        duplicate_detected = duplicate_result.get(
            "duplicate_detected", False
        )

        if not duplicate_detected:
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=extension
            ) as temp_file:
                temp_file.write(image_bytes)
                temp_path = Path(temp_file.name)

            await run_in_threadpool(
                register_image,
                temp_path,
                report_id
            )

        # Save AI analysis in Supabase
        existing_result = (
            supabase.table("ai_results")
            .select("id")
            .eq("report_id", report_id)
            .limit(1)
            .execute()
        )

        if existing_result.data:
            supabase.table("ai_results").update({
                "result": result
            }).eq("report_id", report_id).execute()
        else:
            supabase.table("ai_results").insert({
            "report_id": report_id,
            "result": result
    }).execute()

        # Mark report completed
        supabase.table("reports").update({
            "processing_status": "completed"
        }).eq("id", report_id).execute()

        return {
            "status": "completed",
            "report_id": report_id,
            "duplicate_detected": duplicate_detected,
            "ai_result": result
        }

    except Exception:
        logger.exception("AI processing failed for report %s", report_id)

        try:
            supabase.table("reports").update({
                "processing_status": "failed"
            }).eq("id", report_id).execute()
        except Exception:
            logger.exception("Could not update failed status for %s", report_id)

        return {
            "status": "failed",
            "report_id": report_id
        }

    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


async def main():
    logger.info("SATYAMAP AI worker started")

    while True:
        try:
            response = (
                supabase.table("reports")
                .select("id")
                .eq("processing_status", "queued")
                .limit(5)
                .execute()
            )

            for report in response.data or []:
                await process_report(report["id"])

        except Exception:
            logger.exception("Worker polling failed")

        await asyncio.sleep(10)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
