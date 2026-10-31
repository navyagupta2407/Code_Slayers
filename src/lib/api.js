
const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

// Fetch incident records.
export async function getIncidents(
  token,
  signal
) {

  const response = await fetch(
    `${API_BASE}/api/incidents`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`
            }
          : {})
      },

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

  return incidents;

}

// Validate geocoding results.
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

// Geocode a place using FastAPI.
export async function geocodePlace(
  query,
  token
) {

  const response = await fetch(
    `${API_BASE}/api/geocode`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`
            }
          : {})
      },

      body: JSON.stringify({
        query
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
