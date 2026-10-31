// AI Verification and GIS De-Duplication Engine
// DisasterLens AI: Decision-support system for human verifiers

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates simple token-overlap text similarity (Jaccard index) between two strings
 */
export function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const tokenize = (str) =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  const set1 = tokenize(text1);
  const set2 = tokenize(text2);
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const token of set1) {
    if (set2.has(token)) intersection++;
  }
  const union = new Set([...set1, ...set2]).size;
  return Math.round((intersection / union) * 100);
}

/**
 * Analyzes a target report against all other reports in the database
 * to detect duplicates, calculate GIS proximity, and provide AI verification support.
 */
export function analyzeReportAI(targetReport, allReports = []) {
  if (!targetReport) return null;

  const others = allReports.filter((r) => r.id !== targetReport.id);
  const duplicateCandidates = [];

  for (const other of others) {
    let distanceKm = null;
    if (
      targetReport.latitude != null &&
      targetReport.longitude != null &&
      other.latitude != null &&
      other.longitude != null
    ) {
      distanceKm = calculateDistanceKm(
        targetReport.latitude,
        targetReport.longitude,
        other.latitude,
        other.longitude
      );
    }

    // Time difference in hours
    const targetTime = new Date(targetReport.created_at || Date.now()).getTime();
    const otherTime = new Date(other.created_at || Date.now()).getTime();
    const hoursDiff = Math.abs(Math.round((targetTime - otherTime) / (1000 * 60 * 60)));

    // Text & type similarity
    const sameType = targetReport.disaster_type === other.disaster_type;
    const textSim = calculateTextSimilarity(
      `${targetReport.title} ${targetReport.description} ${targetReport.location}`,
      `${other.title} ${other.description} ${other.location}`
    );

    // Is it a duplicate candidate?
    // Proximity < 25km and within 48 hours with same type, OR high text similarity
    const isNearby = distanceKm != null && distanceKm <= 25 && hoursDiff <= 48;
    const isDuplicate = (isNearby && sameType) || textSim >= 55;

    if (isDuplicate) {
      let combinedScore = textSim;
      if (distanceKm != null) {
        const proximityScore = Math.max(0, 100 - distanceKm * 4);
        combinedScore = Math.round((textSim * 0.4) + (proximityScore * 0.4) + (sameType ? 20 : 0));
      }
      duplicateCandidates.push({
        report: other,
        distanceKm,
        hoursDiff,
        similarityScore: Math.min(99, Math.max(30, combinedScore)),
        sameType,
      });
    }
  }

  // Sort candidate duplicates by highest similarity
  duplicateCandidates.sort((a, b) => b.similarityScore - a.similarityScore);

  // Compute credibility / AI Confidence score
  let baseConfidence = 50;

  // Has evidence images/videos?
  const hasEvidence =
    Array.isArray(targetReport.evidence_urls) && targetReport.evidence_urls.length > 0;
  if (hasEvidence) baseConfidence += 25;

  // Has exact GPS coordinates?
  const hasGps = targetReport.latitude != null && targetReport.longitude != null;
  if (hasGps) baseConfidence += 15;

  // Has detailed description?
  if (targetReport.description && targetReport.description.length > 40) {
    baseConfidence += 10;
  }

  // Corroborated by other verified reports in the vicinity?
  const nearbyVerified = duplicateCandidates.filter((c) => c.report.status === 'verified');
  if (nearbyVerified.length > 0) {
    baseConfidence = Math.min(96, baseConfidence + 12);
  }

  const confidenceScore = Math.min(98, Math.max(25, baseConfidence));

  // Generate assessment text
  let assessment = '';
  if (duplicateCandidates.length > 0) {
    const top = duplicateCandidates[0];
    assessment = `Potential duplicate cluster detected (${top.similarityScore}% match). Located ${top.distanceKm != null ? `${top.distanceKm} km away` : 'in similar region'} within ${top.hoursDiff} hours of report #${top.report.id.slice(0, 8).toUpperCase()}. Corroboration increases incident credibility.`;
  } else if (hasEvidence && hasGps) {
    assessment = `High credibility single-source incident with confirmed GPS coordinates and visual evidence attached. No duplicate reports found in immediate vicinity.`;
  } else if (!hasEvidence) {
    assessment = `Moderate confidence incident without attached photographic evidence. Verifiers should inspect corroborating reports or request further evidence before approving.`;
  } else {
    assessment = `Standard incident report. Coordinates pending geocoding validation.`;
  }

  return {
    confidenceScore,
    duplicateCandidates,
    hasDuplicates: duplicateCandidates.length > 0,
    assessment,
    hasEvidence,
    hasGps,
  };
}

