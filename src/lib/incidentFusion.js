
/*
  DISASTERLENS AI
  INCIDENT FUSION ENGINE

  Purpose:
  Analyze relationships between incoming reports.

  IMPORTANT:
  This is a demo candidate-grouping algorithm.
  It does not automatically verify or merge incidents.
*/


// ==========================================
// 1. DEFAULT CONFIGURATION
// ==========================================

export const FUSION_CONFIG = {
  maxDistanceKm: 5,
  maxTimeDifferenceHours: 3,
  visualDuplicateThreshold: 0.90
};


// ==========================================
// 2. VALIDATE REPORT COORDINATES
// ==========================================

function hasValidReportCoords(report) {

  if (!report) return false;

  const lat = report.latitude;
  const lng = report.longitude;

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


// ==========================================
// 3. CALCULATE DISTANCE USING HAVERSINE
// ==========================================

export function calculateDistanceKm(reportA, reportB) {

  if (
    !hasValidReportCoords(reportA) ||
    !hasValidReportCoords(reportB)
  ) {
    return null;
  }

  const toRadians = degrees =>
    degrees * Math.PI / 180;

  const earthRadiusKm = 6371;

  const lat1 = toRadians(reportA.latitude);
  const lat2 = toRadians(reportB.latitude);

  const deltaLat = toRadians(
    reportB.latitude - reportA.latitude
  );

  const deltaLng = toRadians(
    reportB.longitude - reportA.longitude
  );

  const a =
    Math.sin(deltaLat / 2) ** 2 +

    Math.cos(lat1) *
    Math.cos(lat2) *

    Math.sin(deltaLng / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}


// ==========================================
// 4. CALCULATE TIME DIFFERENCE
// ==========================================

export function calculateTimeDifferenceHours(
  reportA,
  reportB
) {

  const timeA = new Date(
    reportA?.submitted_at
  ).getTime();

  const timeB = new Date(
    reportB?.submitted_at
  ).getTime();

  if (
    !Number.isFinite(timeA) ||
    !Number.isFinite(timeB)
  ) {
    return null;
  }

  return Math.abs(timeA - timeB) / 3600000;
}


// ==========================================
// 5. CHECK MEDIA RELATIONSHIP
// ==========================================

export function checkMediaRelationship(
  reportA,
  reportB,
  config = FUSION_CONFIG
) {

  // Exact fingerprint match.
  if (
    reportA.media_fingerprint &&
    reportB.media_fingerprint &&
    reportA.media_fingerprint ===
      reportB.media_fingerprint
  ) {

    return {
      relationship: "exact_duplicate",
      similarity_score: 1
    };

  }


  // Check AI-generated visual similarity.
  const matches = [

    ...(reportA.visual_similarity_matches || []),

    ...(reportB.visual_similarity_matches || [])

  ];

  const matchingScores = matches

    .filter(match =>

      match.report_id === reportA.id ||
      match.report_id === reportB.id

    )

    .map(match => match.score)

    .filter(score =>

      typeof score === "number" &&
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 1

    );

  const similarityScore = matchingScores.length
    ? Math.max(...matchingScores)
    : null;


  if (
    similarityScore !== null &&
    similarityScore >= config.visualDuplicateThreshold
  ) {

    return {
      relationship: "possible_duplicate",
      similarity_score: similarityScore
    };

  }


  return {
    relationship: "no_duplicate_match_detected",
    similarity_score: similarityScore
  };

}


// ==========================================
// 6. COMPARE TWO REPORTS
// ==========================================

export function compareReports(
  reportA,
  reportB,
  config = FUSION_CONFIG
) {

  const distanceKm = calculateDistanceKm(
    reportA,
    reportB
  );

  const timeDifferenceHours =
    calculateTimeDifferenceHours(
      reportA,
      reportB
    );

  const mediaResult = checkMediaRelationship(
    reportA,
    reportB,
    config
  );


  const sameDisasterType =

    Boolean(reportA.disaster_type) &&

    reportA.disaster_type.toLowerCase() ===
      reportB.disaster_type?.toLowerCase();


  const locationMatches =

    distanceKm !== null &&

    distanceKm <= config.maxDistanceKm;


  const timeMatches =

    timeDifferenceHours !== null &&

    timeDifferenceHours <=
      config.maxTimeDifferenceHours;


  // Candidate event association.
  const sameEventCandidate =

    sameDisasterType &&
    locationMatches &&
    timeMatches;


  const reasons = [];

  if (!sameDisasterType) {
    reasons.push("Different disaster types");
  }

  if (distanceKm === null) {
    reasons.push("Location information unavailable");
  } else if (!locationMatches) {
    reasons.push("Reports are geographically distant");
  }

  if (timeDifferenceHours === null) {
    reasons.push("Submission time unavailable");
  } else if (!timeMatches) {
    reasons.push("Reports exceed the time window");
  }


  if (sameEventCandidate) {
    reasons.push(
      "Same disaster type, nearby coordinates and compatible time"
    );
  }


  return {

    reportAId: reportA.id,

    reportBId: reportB.id,

    distanceKm:
      distanceKm === null
        ? null
        : Number(distanceKm.toFixed(3)),

    timeDifferenceHours:
      timeDifferenceHours === null
        ? null
        : Number(timeDifferenceHours.toFixed(3)),

    mediaRelationship:
      mediaResult.relationship,

    visualSimilarityScore:
      mediaResult.similarity_score,

    eventRelationship:

      sameEventCandidate
        ? "potential_same_event"
        : "not_grouped_by_current_rules",

    potentialCorroborationCandidate:

      sameEventCandidate &&

      mediaResult.relationship ===
        "no_duplicate_match_detected",

    requiresHumanReview: true,

    reasons

  };

}


// ==========================================
// 7. GROUP POTENTIALLY RELATED REPORTS
// ==========================================

export function analyzeReportRelationships(
  reports = [],
  config = FUSION_CONFIG
) {

  if (!Array.isArray(reports)) {
    throw new Error(
      "Reports must be provided as an array"
    );
  }

  const ids = reports.map(report => report.id);

  if (
    reports.some(report => !report?.id) ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error(
      "Every report must have a unique ID"
    );
  }


  // Compare every pair of reports.
  const relationships = [];

  for (let i = 0; i < reports.length; i++) {

    for (
      let j = i + 1;
      j < reports.length;
      j++
    ) {

      relationships.push(

        compareReports(
          reports[i],
          reports[j],
          config
        )

      );

    }

  }


  // ========================================
  // 8. CANDIDATE GROUPING USING UNION-FIND
  // ========================================

  const parent = new Map();

  reports.forEach(report => {
    parent.set(report.id, report.id);
  });


  function find(id) {

    if (parent.get(id) !== id) {

      parent.set(
        id,
        find(parent.get(id))
      );

    }

    return parent.get(id);

  }


  function union(idA, idB) {

    const rootA = find(idA);
    const rootB = find(idB);

    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }

  }


  // Group only geographically and temporally
  // compatible reports of the same disaster type.

  relationships.forEach(pair => {

    if (
      pair.eventRelationship ===
      "potential_same_event"
    ) {

      union(
        pair.reportAId,
        pair.reportBId
      );

    }

  });


  // Build candidate groups.
  const grouped = new Map();

  reports.forEach(report => {

    const root = find(report.id);

    if (!grouped.has(root)) {
      grouped.set(root, []);
    }

    grouped.get(root).push(report);

  });


  const candidateGroups = [];

  grouped.forEach(groupReports => {

    if (groupReports.length < 2) {
      return;
    }

    candidateGroups.push({

      candidateGroupId:
        `CANDIDATE_${candidateGroups.length + 1}`,

      disasterType:
        groupReports[0].disaster_type,

      reportIds:
        groupReports.map(report => report.id),

      reportCount:
        groupReports.length,

      status: "candidate_only",

      requiresHumanReview: true

    });

  });


  // ========================================
  // 9. EXTRACT DUPLICATE AND CORROBORATION PAIRS
  // ========================================

  const duplicatePairs = relationships.filter(pair =>

    pair.mediaRelationship === "exact_duplicate" ||

    pair.mediaRelationship === "possible_duplicate"

  );


  const corroborationPairs = relationships.filter(pair =>

    pair.potentialCorroborationCandidate

  );


  const groupedReportIds = new Set(

    candidateGroups.flatMap(
      group => group.reportIds
    )

  );


  const ungroupedReportIds = reports

    .filter(report =>
      !groupedReportIds.has(report.id)
    )

    .map(report => report.id);


  // ========================================
  // 10. RETURN COMPLETE ANALYSIS
  // ========================================

  return {

    summary: {

      totalReports: reports.length,

      comparedPairs: relationships.length,

      candidateGroupCount:
        candidateGroups.length,

      duplicatePairCount:
        duplicatePairs.length,

      corroborationPairCount:
        corroborationPairs.length

    },

    thresholds: { ...config },

    relationships,

    duplicatePairs,

    corroborationPairs,

    candidateGroups,

    ungroupedReportIds

  };

}

