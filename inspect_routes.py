from app.main import app

print("\n=== SATYAMAP AVAILABLE API ROUTES ===")

for route in app.routes:
    methods = getattr(route, "methods", [])
    path = getattr(route, "path", "")

    if methods:
        print(", ".join(sorted(methods)), path)
