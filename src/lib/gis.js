
/* =========================================
   1. CONSTANTS
========================================= */

export const statuses = [
  'all',
  'verified',
  'pending',
  'rejected'
];

export const disasterTypes = [
  'all',
  'flood',
  'waterlogging',
  'storm',
  'rain',
  'landslide'
];


/* =========================================
   2. VALIDATE GPS COORDINATES
========================================= */

export function hasValidCoords(item) {

  if (!item) return false;

  const lat = item.latitude;
  const lng = item.longitude;

  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&

    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}


/* =========================================
   3. FILTER INCIDENTS
========================================= */

export function filterIncidents(
  items,
  {
    status = 'all',
    type = 'all',
    state = 'all',
    search = '',
    minConfidence = 0
  } = {}
) {

  const query = search.trim().toLowerCase();

  return items.filter((incident) => {

    // Verification status filter
    const statusMatches =
      status === 'all' ||
      incident.verification_status === status;


    // Disaster type filter
    const typeMatches =
      type === 'all' ||
      incident.disaster_type === type;


    // State filter
    const stateMatches =
      state === 'all' ||
      incident.state === state;


    // Search filter
    const searchMatches =
      !query ||
      `${incident.title || ''} ${incident.id || ''} ${incident.description || ''}`
        .toLowerCase()
        .includes(query);


    // AI confidence filter
    const confidenceMatches =
      minConfidence === 0 ||
      (
        typeof incident.ai_confidence === 'number' &&
        incident.ai_confidence >= minConfidence
      );


    // Final filtering condition
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
   4. DASHBOARD SUMMARY
========================================= */

export function summary(items) {

  return {

    incidents: items.length,

    reports: items.reduce(
      (sum, item) =>
        sum + (item.report_count || 0),
      0
    ),

    duplicates: items.reduce(
      (sum, item) =>
        sum + (item.duplicate_report_count || 0),
      0
    ),

    verified: items.filter(
      item =>
        item.verification_status === 'verified'
    ).length,

    unlocated: items.filter(
      item => !hasValidCoords(item)
    ).length

  };

}


/* =========================================
   5. CONFIDENCE PERCENTAGE
========================================= */

export function confidencePercent(value) {

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'Unknown';
  }

  return `${Math.round(
    Math.max(0, Math.min(1, value)) * 100
  )}%`;

}


/* =========================================
   6. DATE FORMATTING
========================================= */

export function formatDate(iso) {

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

}
