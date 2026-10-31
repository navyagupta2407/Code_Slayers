from app.main import app

schema = app.openapi()

print("\n=== REGISTERED API ENDPOINTS ===")

for path, methods in schema.get("paths", {}).items():
    for method, details in methods.items():
        print(method.upper(), path, "-", details.get("summary", ""))
