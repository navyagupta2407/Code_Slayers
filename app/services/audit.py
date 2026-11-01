
import logging
from typing import Any, Optional

from app.database import supabase

logger = logging.getLogger(__name__)


def log_action(
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> bool:
    """Record an auditable application action."""

    if not actor_id or not action or not entity_type:
        logger.warning("Audit event skipped: required fields missing")
        return False

    try:
        supabase.table("audit_logs").insert({
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {},
        }).execute()

        return True

    except Exception:
        logger.exception(
            "Audit logging failed for action=%s entity_type=%s",
            action,
            entity_type,
        )
        return False
