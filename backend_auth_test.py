import requests
from getpass import getpass

BASE_URL = "http://127.0.0.1:8005"

email = input("Registered email: ").strip()
password = getpass("Password: ")

try:
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=20
    )

    print("\nHTTP STATUS:", response.status_code)
    print("RESPONSE:", response.text)

    if response.ok:
        print("\nSUCCESS: Backend authentication works!")
    else:
        print("\nBackend authentication needs fixing.")

except Exception as exc:
    print("\nERROR:", str(exc))
finally:
    password = None
