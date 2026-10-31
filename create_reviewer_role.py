from app.database import supabase

email = input("New reviewer account email: ").strip()

try:
    users = supabase.auth.admin.list_users()

    matched = [
        u for u in users
        if u.email and u.email.lower() == email.lower()
    ]

    if not matched:
        print("ERROR: User not found in Supabase Auth.")
    else:
        user = matched[0]

        result = (
            supabase.table("profiles")
            .update({"role": "reviewer"})
            .eq("id", user.id)
            .execute()
        )

        print("Reviewer role assigned:", bool(result.data))
        print("User ID:", user.id)

except Exception as exc:
    print("ERROR:", type(exc).__name__, str(exc))
