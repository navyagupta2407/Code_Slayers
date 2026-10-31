import requests
from getpass import getpass

BASE = "http://127.0.0.1:8005"

email = input("Reviewer email: ").strip()
password = getpass("Password: ")

session = requests.Session()

try:
    login = session.post(
        f"{BASE}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=20
    )
    print("\nLOGIN STATUS:", login.status_code)
    login.raise_for_status()

    session.headers["Authorization"] = (
        "Bearer " + login.json()["access_token"]
    )

    profile = session.get(f"{BASE}/api/v1/auth/me")
    print("\nPROFILE STATUS:", profile.status_code)
    if profile.ok:
        print("Profile:", profile.json())

    for endpoint in [
        "/api/v1/reports/pending",
        "/api/v1/reports/all"
    ]:
        response = session.get(BASE + endpoint)
        print(f"\n{endpoint}: HTTP {response.status_code}")

        if response.ok:
            data = response.json()
            print("Total reports:", data.get("total", "N/A"))
        else:
            print("Error:", response.text[:300])

finally:
    session.close()
    password = None
