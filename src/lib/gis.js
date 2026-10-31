
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
  "landslide",
  "cyclone",
  "earthquake",
  "wildfire",
  "drought",
  "tsunami",
  "heatwave",
  "coldwave"
];


/* =========================================
   2. HELPER FUNCTIONS
========================================= */

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

// Normalize AI confidence to decimal format.
function normalizeConfidence(value) {

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value > 1 ? value / 100 : value
    )
  );

}

// Safely normalize report counts.
function normalizeCount(value) {

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.floor(Math.max(0, value));

}

// Check whether an item is a valid object.
function isValidRecord(item) {

  return (
    item !== null &&
    typeof item === "object" &&
    !Array.isArray(item)
  );

}


/* =========================================
   3. DATA NORMALIZATION
========================================= */

export function normalizeIncident(item = {}) {

  if (!isValidRecord(item)) {
    item = {};
  }

  const duplicateEvidence = Array.isArray(
    item.duplicate_evidence
  )
    ? item.duplicate_evidence
    : [];

  const rawId =
    item.id ??
    item.canonical_incident_id ??
    item.incident_id ??
    "";

  const rawTitle =
    item.title ??
    item.incident_title ??
    item.incident_type ??
    item.disaster_type ??
    "Untitled incident";

  const duplicateCount =
    typeof item.duplicate_report_count === "number" &&
    Number.isFinite(item.duplicate_report_count)
      ? normalizeCount(item.duplicate_report_count)
      : duplicateEvidence.length;

  return {

    ...item,

    // Incident identification.
    id: String(rawId),

    title: String(rawTitle),

    // Disaster classification.
    disaster_type: normalizeText(
      item.disaster_type ??
      item.incident_type ??
      "unknown"
    ),

    // Verification status.
    verification_status: normalizeText(
      item.verification_status ??
      item.status ??
      "pending"
    ),

    // Geographic information.
    state:
      String(item.state ?? "").trim() || "Unknown",

    // Report statistics.
    report_count: normalizeCount(
      item.report_count
    ),

    duplicate_report_count: duplicateCount,

    duplicate_evidence: duplicateEvidence,

    // AI confidence normalization.
    ai_confidence: normalizeConfidence(
      item.ai_confidence
    ),

    location_confidence: normalizeConfidence(
      item.location_confidence
    )

  };

}


/* =========================================
   4. VALIDATE GPS COORDINATES
========================================= */

export function hasValidCoords(item) {

  if (!isValidRecord(item)) {
    return false;
  }

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
   5. FILTER INCIDENTS
========================================= */

export function filterIncidents(
  items = [],
  options = {}
) {

  if (!Array.isArray(items)) {
    return [];
  }

  const filters =
    isValidRecord(options) ? options : {};

  const {
    status = "all",
    type = "all",
    state = "all",
    search = "",
    minConfidence = 0
  } = filters;

  const query = normalizeText(search);

  const selectedStatus =
    normalizeText(status) || "all";

  const selectedType =
    normalizeText(type) || "all";

  const selectedState =
    normalizeText(state) || "all";

  // Support both 30 and 0.30.
  const rawThreshold = Number(minConfidence);

  const safeThreshold = Number.isFinite(rawThreshold)
    ? rawThreshold
    : 0;

  const threshold = Math.max(
    0,
    Math.min(
      1,
      safeThreshold > 1
        ? safeThreshold / 100
        : safeThreshold
    )
  );

  return items.filter((originalIncident) => {

    // Ignore malformed records.
    if (!isValidRecord(originalIncident)) {
      return false;
    }

    const incident = normalizeIncident(
      originalIncident
    );

    // Verification status.
    const statusMatches =
      selectedStatus === "all" ||
      incident.verification_status === selectedStatus;

    // Disaster type.
    const typeMatches =
      selectedType === "all" ||
      incident.disaster_type === selectedType;

    // State.
    const stateMatches =
      selectedState === "all" ||
      normalizeText(incident.state) === selectedState;

    // Search.
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
    const confidence = incident.ai_confidence;

    const confidenceMatches =
      threshold === 0 ||
      (
        confidence !== null &&
        confidence >= threshold
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
   6. DASHBOARD SUMMARY
========================================= */

export function summary(items = []) {

  const normalizedItems = (
    Array.isArray(items) ? items : []
  )
    .filter(isValidRecord)
    .map(normalizeIncident);

  return {

    // Total canonical incidents.
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
   7. CONFIDENCE PERCENTAGE
========================================= */

export function confidencePercent(value) {

  const normalized = normalizeConfidence(value);

  if (normalized === null) {
    return "Unknown";
  }

  return `${Math.round(normalized * 100)}%`;

}


/* =========================================
   8. DATE FORMATTING
========================================= */

export function formatDate(iso) {

  if (!iso) {
    return "Unknown";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {

    dateStyle: "medium",
    timeStyle: "short"

  });

}
