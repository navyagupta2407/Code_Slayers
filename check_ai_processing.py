import time
from app.database import supabase

REPORT_ID = "e7ee6da1-9d74-434c-acfe-170bbcad9f44"

print("\n=== SATYAMAP AI PROCESSING CHECK ===")

for attempt in range(6):
    try:
        report = (
            supabase.table("reports")
            .select("id,processing_status,verification_status")
            .eq("id", REPORT_ID)
            .single()
            .execute()
        )

        print("\nReport status:", report.data)

        results = (
            supabase.table("ai_results")
            .select("*")
            .eq("report_id", REPORT_ID)
            .execute()
        )

        if results.data:
            print("\nAI RESULT FOUND!")
            for item in results.data:
                print(item)
            break

        print("AI result not available yet. Waiting 10 seconds...")

    except Exception as exc:
        print("CHECK ERROR:", str(exc))
        break

    if attempt < 5:
        time.sleep(10)

print("\n=== CHECK COMPLETE ===")
