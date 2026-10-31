import requests

url = "http://127.0.0.1:8005/openapi.json"
response = requests.get(url, timeout=15)
response.raise_for_status()

data = response.json()

print("\n========== SATYAMAP REPORT API ==========")

for path, methods in data.get("paths", {}).items():
    if "report" not in path.lower():
        continue

    for method, details in methods.items():
        print(f"\n{method.upper()} {path}")
        print("Summary:", details.get("summary", "N/A"))

        for parameter in details.get("parameters", []):
            print("Parameter:", parameter.get("name"))

        body = details.get("requestBody", {})
        for content_type, content in body.get("content", {}).items():
            schema = content.get("schema", {})
            print("Content type:", content_type)
            print("Schema:", schema)

print("\n========== REQUEST SCHEMAS ==========")

for name, schema in data.get("components", {}).get("schemas", {}).items():
    if any(word in name.lower() for word in ["report", "media"]):
        print(f"\n{name}:")
        print(schema)
