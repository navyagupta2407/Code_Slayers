
/* =========================================
   1. CONSTANTS
========================================= */

export const statuses = [
  "all",
  "verified",
  "pending",
  "rejected"
];

export const disasterTypes = [
  "all",
  "flood",
  "waterlogging",
  "storm",
  "rain",
  "landslide"
];


/* =========================================
   2. DATA NORMALIZATION
   Supports frontend and backend schemas
========================================= */

export function normalizeIncident(item = {}) {

  const duplicateEvidence = Array.isArray(
    item.duplicate_evidence
  )
    ? item.duplicate_evidence
    : [];

  const duplicateCount =
    typeof item.duplicate_report_count === "number" &&
    Number.isFinite(item.duplicate_report_count)
      ? item.duplicate_report_count
      : duplicateEvidence.length;

  return {

    ...item,

    id:
      item.id ??
      item.canonical_incident_id ??
      item.incident_id ??
      "",

    title:
      item.title ??
      item.incident_title ??
      item.incident_type ??
      item.disaster_type ??
      "Untitled incident",

    disaster_type:
      item.disaster_type ??
      item.incident_type ??
      "unknown",

    verification_status:
      item.verification_status ??
      item.status ??
      "pending",

    report_count:
      typeof item.report_count === "number" &&
      Number.isFinite(item.report_count)
        ? item.report_count
        : 0,

    duplicate_report_count: duplicateCount,

    state: item.state ?? "Unknown"

  };

}


/* =========================================
   3. VALIDATE GPS COORDINATES
========================================= */

export function hasValidCoords(item) {

  if (!item) return false;

  const lat = item.latitude;
  const lng = item.longitude;

  return (

    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&

    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180

  );

}


/* =========================================
   4. FILTER INCIDENTS
========================================= */

export function filterIncidents(
  items = [],
  {
    status = "all",
    type = "all",
    state = "all",
    search = "",
    minConfidence = 0
  } = {}
) {

  const query = String(search).trim().toLowerCase();

  const rawThreshold = Number(minConfidence) || 0;

  // Support both 30 and 0.30.
  const threshold = Math.max(
    0,
    Math.min(
      1,
      rawThreshold > 1
        ? rawThreshold / 100
        : rawThreshold
    )
  );

  return items.filter((originalIncident) => {

    const incident = normalizeIncident(
      originalIncident
    );

    // Verification status.
    const statusMatches =
      status === "all" ||
      incident.verification_status === status;

    // Disaster type.
    const typeMatches =
      type === "all" ||
      incident.disaster_type?.toLowerCase() ===
        type.toLowerCase();

    // State.
    const stateMatches =
      state === "all" ||
      incident.state?.trim().toLowerCase() ===
        state.trim().toLowerCase();

    // Search by title, ID, description, state or district.
    const searchableText = [

      incident.title,
      incident.id,
      incident.description,
      incident.state,
      incident.district,
      incident.disaster_type

    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchMatches =
      !query ||
      searchableText.includes(query);

    // AI confidence.
    const confidenceMatches =
      threshold === 0 ||
      (
        typeof incident.ai_confidence === "number" &&
        Number.isFinite(incident.ai_confidence) &&
        incident.ai_confidence >= threshold
      );

    return (
      statusMatches &&
      typeMatches &&
      stateMatches &&
      searchMatches &&
      confidenceMatches
    );

  });

}


/* =========================================
   5. DASHBOARD SUMMARY
========================================= */

export function summary(items = []) {

  const normalizedItems = items.map(
    normalizeIncident
  );

  return {

    // Canonical incidents.
    incidents: normalizedItems.length,

    // Total citizen submissions.
    reports: normalizedItems.reduce(
      (sum, item) =>
        sum + item.report_count,
      0
    ),

    // Additional linked reports.
    duplicates: normalizedItems.reduce(
      (sum, item) =>
        sum + item.duplicate_report_count,
      0
    ),

    // Verified incidents.
    verified: normalizedItems.filter(
      item =>
        item.verification_status === "verified"
    ).length,

    // Incidents without valid GPS coordinates.
    unlocated: normalizedItems.filter(
      item => !hasValidCoords(item)
    ).length

  };

}


/* =========================================
   6. CONFIDENCE PERCENTAGE
========================================= */

export function confidencePercent(value) {

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Unknown";
  }

  // Accept decimal or percentage input.
  const normalized = value > 1
    ? value / 100
    : value;

  return `${Math.round(
    Math.max(0, Math.min(1, normalized)) * 100
  )}%`;

}


/* =========================================
   7. DATE FORMATTING
========================================= */

export function formatDate(iso) {

  if (!iso) return "Unknown";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {

    dateStyle: "medium",
    timeStyle: "short"

  });

}
