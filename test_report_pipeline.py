import requests
from getpass import getpass
from PIL import Image, ImageDraw

BASE = "http://127.0.0.1:8005"

# Generate a synthetic integration-test image
img = Image.new("RGB", (800, 500), "#b7cbd5")
draw = ImageDraw.Draw(img)

draw.rectangle((0, 270, 800, 500), fill="#287da3")
draw.rectangle((70, 120, 260, 290), fill="#a9a39a")
draw.rectangle((320, 80, 510, 290), fill="#c1b6a4")
draw.rectangle((570, 150, 740, 290), fill="#9d988f")

draw.text((25, 25), "SATYAMAP - SYNTHETIC TEST IMAGE", fill="black")
draw.text((25, 450), "NOT REAL DISASTER EVIDENCE", fill="white")

image_path = "synthetic_flood_test.png"
img.save(image_path)

email = input("Registered email: ").strip()
password = getpass("Password: ")

session = requests.Session()

try:
    # Login
    login = session.post(
        f"{BASE}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=20
    )
    login.raise_for_status()

    token = login.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("\n1. LOGIN: SUCCESS")

    # Create report
    report_data = {
        "description": "Synthetic flood report created only to test the SATYAMAP report and AI processing pipeline. This is not a real incident.",
        "incident_type": "flood",
        "latitude": 30.9010,
        "longitude": 75.8573
    }

    created = session.post(
        f"{BASE}/api/v1/reports",
        json=report_data,
        timeout=20
    )

    print("\n2. REPORT CREATION STATUS:", created.status_code)
    print("Response:", created.text[:1500])
    created.raise_for_status()

    result = created.json()
    report = result.get("report", result)
    report_id = report.get("id") or report.get("report_id")

    if not report_id:
        print("\nReport created, but ID was not found in the response.")
        print("Share the response above so we can identify its structure.")
        raise SystemExit(0)

    print("\nREPORT ID:", report_id)

    # Upload synthetic image
    with open(image_path, "rb") as image_file:
        uploaded = session.post(
            f"{BASE}/api/v1/reports/{report_id}/media",
            files={"file": ("synthetic_flood_test.png", image_file, "image/png")},
            timeout=30
        )

    print("\n3. IMAGE UPLOAD STATUS:", uploaded.status_code)
    print("Response:", uploaded.text[:1500])
    uploaded.raise_for_status()

    print("\nSUCCESS: Report created and image uploaded!")

except requests.RequestException as exc:
    print("\nREQUEST FAILED:", str(exc))
    if getattr(exc, "response", None) is not None:
        print("Server response:", exc.response.text[:2000])

finally:
    password = None
    token = None
    session.close()
