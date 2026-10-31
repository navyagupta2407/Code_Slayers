import requests
from getpass import getpass

BASE = "http://127.0.0.1:8005"
REPORT_ID = "e7ee6da1-9d74-434c-acfe-170bbcad9f44"

email = input("Email: ").strip()
password = getpass("Password: ")

try:
    session = requests.Session()

    login = session.post(
        f"{BASE}/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    login.raise_for_status()

    session.headers["Authorization"] = (
        "Bearer " + login.json()["access_token"]
    )

    print("\n1. LOGIN: PASSED")

    mine = session.get(f"{BASE}/api/v1/reports/me")
    print("\n2. MY REPORTS:", mine.status_code)
    print(mine.text[:2000])

    detail = session.get(
        f"{BASE}/api/v1/reports/{REPORT_ID}"
    )
    print("\n3. REPORT DETAILS:", detail.status_code)
    print(detail.text[:2000])

    if mine.ok and detail.ok:
        print("\nSUCCESS: Both retrieval APIs work!")
    else:
        print("\nSome retrieval functionality needs fixing.")

except Exception as exc:
    print("\nERROR:", str(exc))

finally:
    password = None
    session.close()
