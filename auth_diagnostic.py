from getpass import getpass
from app.config import settings
from supabase import create_client

print("\n=== SATYAMAP AUTH DIAGNOSTIC ===")

email = input("Registered email: ").strip()
password = getpass("Password: ")

try:
    client = create_client(
        settings.supabase_url,
        settings.supabase_publishable_key
    )

    response = client.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    if response.session:
        print("\nSUCCESS: Supabase login works!")
        print("User ID:", response.user.id)
        print("Email:", response.user.email)
        print("Access token received:", bool(response.session.access_token))
    else:
        print("\nNo session returned.")

except Exception as exc:
    print("\nAUTH ERROR:", type(exc).__name__)
    print("Details:", str(exc))

finally:
    password = None
