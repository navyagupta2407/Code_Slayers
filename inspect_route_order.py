from app.main import app

print("\n=== REPORT ROUTE MATCHING ORDER ===")

for route in app.routes:
    path = getattr(route, "path", "")
    methods = getattr(route, "methods", set())

    if path.startswith("/api/v1/reports"):
        print(
            sorted(methods),
            path,
            "->",
            getattr(route.endpoint, "__name__", "unknown")
        )
