
import hashlib
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.auth import get_current_user, require_roles
from app.database import supabase
from app.schemas import ReportCreate, ModerationDecision
from app.services.audit import log_action
from app.services.storage import validate_image

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Disaster Reports"],
)

BUCKET = "report-media"
MAX_FILE_SIZE = 10 * 1024 * 1024

DISASTER_TYPE_MAP = {
    "flood": "Flood",
    "storm": "Storm",
    "landslide": "Landslide",
    "heatwave": "Heatwave",
    "other": "Other",
}

SEVERITY_MAP = {
    "low": "Low",
    "moderate": "Medium",
    "medium": "Medium",
    "high": "High",
}


# ==========================================
# 1. CREATE REPORT
# ==========================================

@router.post("", status_code=201)
def create_report(
    report: ReportCreate,
    user=Depends(get_current_user),
):
    try:
        payload = {
            "user_id": user["id"],
            "title": report.title or f"{report.incident_type.title()} report",
            "description": report.description,
            "disaster_type": DISASTER_TYPE_MAP[report.incident_type],
            "location": report.location or (
                f"{report.latitude}, {report.longitude}"
            ),
            "latitude": report.latitude,
            "longitude": report.longitude,
            "severity": SEVERITY_MAP.get(
                (report.severity or "moderate").lower(),
                "Medium",
            ),
        }

        result = (
            supabase.table("reports")
            .insert(payload)
            .execute()
        )

        if not result.data:
            raise HTTPException(500, "Could not create report")

        created = result.data[0]

        log_action(
            user["id"],
            "REPORT_CREATED",
            "report",
            created["id"],
            {"incident_type": report.incident_type},
        )

        return {
            "message": "Report submitted successfully",
            "report": created,
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Report submission failed")
        raise HTTPException(500, "Report submission failed")


# ==========================================
# 2. GET MY REPORTS
# ==========================================

@router.get("/me")
def get_my_reports(user=Depends(get_current_user)):
    try:
        result = (
            supabase.table("reports")
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )

        return {"reports": result.data or []}

    except Exception:
        logger.exception("Could not retrieve user reports")
        raise HTTPException(500, "Could not retrieve reports")


# ==========================================
# 3. GET PENDING REPORTS
# REVIEWER / ADMIN ONLY
# ==========================================

@router.get("/pending")
def get_pending_reports(
    user=Depends(require_roles("reviewer", "admin")),
):
    try:
        result = (
            supabase.table("reports")
            .select("*")
            .eq("status", "pending")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "reports": result.data or [],
            "total": len(result.data or []),
        }

    except Exception:
        logger.exception("Could not retrieve pending reports")
        raise HTTPException(500, "Could not retrieve pending reports")


# ==========================================
# 4. GET ALL REPORTS
# REVIEWER / ADMIN ONLY
# ==========================================

@router.get("/all")
def get_all_reports(
    user=Depends(require_roles("reviewer", "admin")),
):
    try:
        result = (
            supabase.table("reports")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "reports": result.data or [],
            "total": len(result.data or []),
        }

    except Exception:
        logger.exception("Could not retrieve all reports")
        raise HTTPException(500, "Could not retrieve reports")


# ==========================================
# 5. VERIFY / REJECT REPORT
# REVIEWER / ADMIN ONLY
# ==========================================

@router.patch("/{report_id}/verify")
def verify_report(
    report_id: str,
    decision: ModerationDecision,
    user=Depends(require_roles("reviewer", "admin")),
):
    try:
        existing = (
            supabase.table("reports")
            .select("id,user_id,status")
            .eq("id", report_id)
            .maybe_single()
            .execute()
        )

        if not existing.data:
            raise HTTPException(404, "Report not found")

        old_status = existing.data["status"]
        new_status = decision.verification_status

        if old_status == new_status:
            raise HTTPException(
                409,
                "Report already has this verification status",
            )

        update_payload = {
            "status": new_status,
            "verification_notes": decision.review_note,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "verified_by": user["id"],
        }

        updated = (
            supabase.table("reports")
            .update(update_payload)
            .eq("id", report_id)
            .execute()
        )

        if not updated.data:
            raise HTTPException(500, "Could not update report")

        log_action(
            user["id"],
            "REPORT_VERIFICATION_UPDATED",
            "report",
            report_id,
            {
                "previous_status": old_status,
                "new_status": new_status,
                "reviewer_role": user["role"],
                "review_note": decision.review_note,
            },
        )

        return {
            "message": "Report review completed successfully",
            "report": updated.data[0],
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Report verification failed")
        raise HTTPException(500, "Report verification failed")


# ==========================================
# 6. GET INDIVIDUAL REPORT
# ==========================================

@router.get("/{report_id}")
def get_report(
    report_id: str,
    user=Depends(get_current_user),
):
    try:
        result = (
            supabase.table("reports")
            .select("*")
            .eq("id", report_id)
            .maybe_single()
            .execute()
        )

        report = result.data

        if not report:
            raise HTTPException(404, "Report not found")

        is_owner = report["user_id"] == user["id"]
        is_reviewer = user["role"] in ["reviewer", "admin"]

        if not is_owner and not is_reviewer:
            raise HTTPException(403, "Access denied")

        return {"report": report}

    except HTTPException:
        raise
    except Exception:
        logger.exception("Could not retrieve report")
        raise HTTPException(500, "Could not retrieve report")


# ==========================================
# 7. UPLOAD REPORT MEDIA
# ==========================================

@router.post("/{report_id}/media", status_code=201)
async def upload_report_media(
    report_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    storage_path = None
    media_id = None
    storage_uploaded = False

    try:
        report_result = (
            supabase.table("reports")
            .select("id,user_id")
            .eq("id", report_id)
            .maybe_single()
            .execute()
        )

        report = report_result.data

        if not report:
            raise HTTPException(404, "Report not found")

        if report["user_id"] != user["id"]:
            raise HTTPException(
                403,
                "You cannot upload media to this report",
            )

        file_bytes = await file.read(MAX_FILE_SIZE + 1)

        if not file_bytes:
            raise HTTPException(400, "Empty image file")

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                413,
                "Image exceeds the 10 MB limit",
            )

        content_type = validate_image(file_bytes)
        image_hash = hashlib.sha256(file_bytes).hexdigest()

        extension_map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        }

        extension = extension_map.get(content_type)

        if not extension:
            raise HTTPException(415, "Unsupported image format")

        filename = f"{uuid.uuid4().hex}.{extension}"
        storage_path = f"{user['id']}/{report_id}/{filename}"

        supabase.storage.from_(BUCKET).upload(
            storage_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "false",
            },
        )

        storage_uploaded = True

        media_result = (
            supabase.table("report_media")
            .insert({
                "report_id": report_id,
                "storage_path": storage_path,
                "sha256": image_hash,
                "media_type": content_type,
            })
            .execute()
        )

        if not media_result.data:
            raise HTTPException(
                500,
                "Could not save media metadata",
            )

        media_id = media_result.data[0]["id"]

        queue_result = (
            supabase.table("reports")
            .update({"processing_status": "queued"})
            .eq("id", report_id)
            .execute()
        )

        if not queue_result.data:
            raise HTTPException(
                500,
                "Could not queue report for AI processing",
            )

        log_action(
            user["id"],
            "MEDIA_UPLOADED",
            "report",
            report_id,
            {
                "media_type": content_type,
                "sha256": image_hash,
            },
        )

        return {
            "message": "Evidence image uploaded successfully",
            "media": media_result.data[0],
            "processing_status": "queued",
        }

    except HTTPException:
        if storage_uploaded and storage_path:
            try:
                if media_id:
                    (
                        supabase.table("report_media")
                        .delete()
                        .eq("id", media_id)
                        .execute()
                    )

                supabase.storage.from_(BUCKET).remove([storage_path])

            except Exception:
                logger.exception("Failed to clean up uploaded evidence")

        raise

    except Exception:
        logger.exception("Image upload failed")

        if storage_uploaded and storage_path:
            try:
                if media_id:
                    (
                        supabase.table("report_media")
                        .delete()
                        .eq("id", media_id)
                        .execute()
                    )

                supabase.storage.from_(BUCKET).remove([storage_path])

            except Exception:
                logger.exception("Failed to clean up uploaded evidence")

        raise HTTPException(500, "Image upload failed")

    finally:
        await file.close()
    