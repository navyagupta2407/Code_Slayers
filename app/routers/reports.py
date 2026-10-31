import hashlib
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.auth import get_current_user, require_roles
from app.database import supabase
from app.schemas import ReportCreate, ModerationDecision
from app.services.storage import validate_image
from app.services.audit import log_action


import logging
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/reports", tags=["Disaster Reports"])

BUCKET = "report-media"


# ==========================================
# 1. CREATE REPORT
# ==========================================

@router.post("")
def create_report(
    report: ReportCreate,
    user=Depends(get_current_user)
):
    try:
        disaster_type_map = {
    "flood": "Flood",
    "storm": "Storm",
    "landslide": "Landslide",
    "heatwave": "Heatwave",
    "other": "Other"
}

        severity_map = {
    "low": "Low",
    "moderate": "Medium",
    "medium": "Medium",
    "high": "High"
}

        payload = {
    "user_id": user["id"],
    "title": report.title or f"{report.incident_type.title()} report",
    "description": report.description,
    "disaster_type": disaster_type_map[report.incident_type],
    "location": report.location or (
        f"{report.latitude}, {report.longitude}"
    ),
    "latitude": report.latitude,
    "longitude": report.longitude,
    "severity": severity_map.get(
        (report.severity or "moderate").lower(),
        "Medium"
    )
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
            {"incident_type": report.incident_type}
        )

        return {
            "message": "Report submitted successfully",
            "report": created
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
        raise HTTPException(500, "Could not retrieve reports")


# ==========================================
# 3. GET PENDING REPORTS
# REVIEWER / ADMIN ONLY
# ==========================================

@router.get("/pending")
def get_pending_reports(
    user=Depends(require_roles("reviewer", "admin"))
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
            "total": len(result.data or [])
        }

    except Exception:
        raise HTTPException(500, "Could not retrieve pending reports")


# ==========================================
# 4. GET ALL REPORTS
# REVIEWER / ADMIN ONLY
# ==========================================

@router.get("/all")
def get_all_reports(
    user=Depends(require_roles("reviewer", "admin"))
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
            "total": len(result.data or [])
        }

    except Exception:
        raise HTTPException(500, "Could not retrieve reports")


# ==========================================
# 5. REVIEW / APPROVE / REJECT REPORT
# REVIEWER / ADMIN ONLY
# ==========================================

@router.patch("/{report_id}/verify")
def verify_report(
    report_id: str,
    decision: ModerationDecision,
    user=Depends(require_roles("reviewer", "admin"))
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

        if old_status == decision.verification_status:
            raise HTTPException(
                409,
                "Report already has this verification status"
            )

        update_payload = {
            "status": decision.verification_status,
            "verification_notes": decision.review_note,
            "verified_at": (
                datetime.now(timezone.utc).isoformat()
                if decision.verification_status == "verified"
                else None
            ),
            "verified_by": user["id"]
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
                "new_status": decision.verification_status,
                "review_note": decision.review_note,
                "reviewer_role": user["role"]
            }
        )

        return {
            "message": "Report review completed successfully",
            "report": updated.data[0]
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
    user=Depends(get_current_user)
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
        raise HTTPException(500, "Could not retrieve report")


# ==========================================
# 7. UPLOAD REPORT MEDIA
# ==========================================

@router.post("/{report_id}/media")
async def upload_report_media(
    report_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    storage_path = None

    try:
        result = (
            supabase.table("reports")
            .select("id,user_id")
            .eq("id", report_id)
            .maybe_single()
            .execute()
        )

        report = result.data

        if not report:
            raise HTTPException(404, "Report not found")

        if report["user_id"] != user["id"]:
            raise HTTPException(
                403,
                "You cannot upload media to this report"
            )

        file_bytes = await file.read()
        content_type = validate_image(file_bytes)

        image_hash = hashlib.sha256(file_bytes).hexdigest()

        extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }[content_type]

        filename = f"{uuid.uuid4().hex}.{extension}"
        storage_path = f"{user['id']}/{report_id}/{filename}"

        supabase.storage.from_(BUCKET).upload(
            storage_path,
            file_bytes,
            {
                "content-type": content_type,
                "upsert": "false"
            }
        )

        media_result = (
            supabase.table("report_media")
            .insert({
                "report_id": report_id,
                "storage_path": storage_path,
                "sha256": image_hash,
                "media_type": content_type
            })
            .execute()
        )

        if not media_result.data:
            supabase.storage.from_(BUCKET).remove([storage_path])
            raise HTTPException(500, "Could not save media metadata")

        supabase.table("reports").update({
            "processing_status": "queued"
        }).eq("id", report_id).execute()

        log_action(
            user["id"],
            "MEDIA_UPLOADED",
            "report",
            report_id,
            {"media_type": content_type}
        )

        return {
            "message": "Evidence image uploaded successfully",
            "media": media_result.data[0]
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "Image upload failed")
    finally:
        await file.close()
