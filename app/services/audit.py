from app.database import supabase

def log_action(
    actor_id,
    action,
    entity_type,
    entity_id=None,
    details=None
):
    try:
        supabase.table("audit_logs").insert({
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details or {}
        }).execute()
    except Exception as exc:
        # Do not expose internal database details to API users.
        print(f"Audit logging failed: {type(exc).__name__}")
