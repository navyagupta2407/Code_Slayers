
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

// Build authorization headers.
function getHeaders(token, json = false) {
  return {
    Accept: "application/json",
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {})
  };
}

// Normalize backend incident data for the GIS frontend.
export function normalizeIncident(item) {

  if (!item || typeof item !== "object") {
    throw new Error("Invalid incident record");
  }

  const evidence = Array.isArray(item.duplicate_evidence)
    ? item.duplicate_evidence
    : [];

  return {
    ...item,

    id: item.id ?? item.canonical_incident_id,

    title: item.title ||
      `${item.incident_type || item.disaster_type || "Disaster"} incident`,

    disaster_type:
      item.disaster_type || item.incident_type || "unknown",

    verification_status:
      item.verification_status || item.status || "pending",

    latitude:
      item.latitude == null || item.latitude === ""
        ? null
        : Number(item.latitude),

    longitude:
      item.longitude == null || item.longitude === ""
        ? null
        : Number(item.longitude),

    ai_confidence:
      item.ai_confidence == null
        ? null
        : Number(item.ai_confidence),

    report_count: Number(item.report_count) || 0,

    duplicate_evidence: evidence,

    duplicate_report_count:
      Number(item.duplicate_report_count) || evidence.length
  };
}


// Fetch nationwide incidents.
export async function getIncidents(token, signal) {

  const response = await fetch(
    `${API_BASE}/api/v1/incidents`,
    {
      method: "GET",
      headers: getHeaders(token),
      signal
    }
  );

  if (!response.ok) {
    throw new Error(
      `Incident API failed: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  const incidents = Array.isArray(data)
    ? data
    : data?.incidents;

  if (!Array.isArray(incidents)) {
    throw new Error(
      "Backend must return an incidents array"
    );
  }

  return incidents.map(normalizeIncident);
}


// Fetch an individual canonical incident.
export async function getIncidentDetails(id, token) {

  const response = await fetch(
    `${API_BASE}/api/v1/incidents/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: getHeaders(token)
    }
  );

  if (!response.ok) {
    throw new Error(
      `Incident details failed: HTTP ${response.status}`
    );
  }

  const data = await response.json();

  return normalizeIncident(data);
}


// Validate geographical coordinates.
function validateLocation(data) {

  return (
    data &&
    typeof data.latitude === "number" &&
    Number.isFinite(data.latitude) &&
    data.latitude >= -90 &&
    data.latitude <= 90 &&
    typeof data.longitude === "number" &&
    Number.isFinite(data.longitude) &&
    data.longitude >= -180 &&
    data.longitude <= 180
  );
}


// Geocode a location using FastAPI.
export async function geocodePlace(query, token) {

  if (!query?.trim()) {
    throw new Error("Please enter a location");
  }

  const response = await fetch(
    `${API_BASE}/api/v1/geocode`,
    {
      method: "POST",
      headers: getHeaders(token, true),
      body: JSON.stringify({
        query: query.trim()
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Geocoding failed: HTTP ${response.status}`
    );
  }

  const result = await response.json();

  if (!validateLocation(result)) {
    throw new Error(
      "Geocoding service returned invalid coordinates"
    );
  }

  return result;
}
