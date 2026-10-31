from app.database import supabase
import traceback

print("\n=== REVIEWER DATABASE DIAGNOSTIC ===")

tests = [
    (
        "All reports query",
        lambda: supabase.table("reports")
            .select("*")
            .order("created_at", desc=True)
            .execute()
    ),
    (
        "Pending reports query",
        lambda: supabase.table("reports")
            .select("*")
            .in_("verification_status", ["unverified", "probable"])
            .order("created_at", desc=True)
            .execute()
    )
]

for name, query in tests:
    print(f"\nTesting: {name}")

    try:
        result = query()
        print("SUCCESS")
        print("Records:", len(result.data or []))

    except Exception as exc:
        print("FAILED:", type(exc).__name__)
        print("DETAILS:", str(exc))
        traceback.print_exc()

print("\n=== DIAGNOSTIC COMPLETE ===")
