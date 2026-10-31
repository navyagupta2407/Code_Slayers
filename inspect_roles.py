from app.database import supabase

print("\n=== SATYAMAP USER ROLE INSPECTION ===")

try:
    result = (
        supabase.table("profiles")
        .select("id,role,created_at")
        .execute()
    )

    for user in result.data or []:
        print({
            "user_id": user["id"],
            "role": user["role"],
            "created_at": user["created_at"]
        })

    print("\nTotal profiles:", len(result.data or []))

except Exception as exc:
    print("ERROR:", type(exc).__name__, str(exc))
