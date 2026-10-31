
/*
  SYNTHETIC REPORT DATA
  For Incident Fusion Engine testing only.
  These are NOT real disaster reports.
*/

export const demoReports = [

  // =====================================
  // LUDHIANA FLOOD - REPORT 1
  // Original evidence
  // =====================================

  {
    id: "RPT-201",

    reporter_ref: "DEMO_USER_01",

    disaster_type: "flood",

    latitude: 30.9009,
    longitude: 75.8573,

    claimed_location: "Ludhiana, Punjab",

    location_source: "citizen_gps",

    submitted_at: "2026-10-31T05:00:00Z",

    media_fingerprint: "demo-media-A",

    visual_similarity_matches: []
  },


  // =====================================
  // REPORT 2 - EXACT DUPLICATE
  // Same media fingerprint
  // =====================================

  {
    id: "RPT-202",

    reporter_ref: "DEMO_USER_02",

    disaster_type: "flood",

    latitude: 30.9012,
    longitude: 75.8580,

    claimed_location: "Ludhiana, Punjab",

    location_source: "citizen_gps",

    submitted_at: "2026-10-31T05:07:00Z",

    media_fingerprint: "demo-media-A",

    visual_similarity_matches: []
  },


  // =====================================
  // REPORT 3 - DISTINCT EVIDENCE
  // Different media
  // =====================================

  {
    id: "RPT-203",

    reporter_ref: "DEMO_USER_03",

    disaster_type: "flood",

    latitude: 30.9030,
    longitude: 75.8600,

    claimed_location: "Ludhiana, Punjab",

    location_source: "citizen_gps",

    submitted_at: "2026-10-31T05:12:00Z",

    media_fingerprint: "demo-media-B",

    visual_similarity_matches: []
  },


  // =====================================
  // REPORT 4 - POSSIBLE VISUAL DUPLICATE
  // AI similarity score is illustrative
  // =====================================

  {
    id: "RPT-204",

    reporter_ref: "DEMO_USER_04",

    disaster_type: "flood",

    latitude: 30.8990,
    longitude: 75.8540,

    claimed_location: "Ludhiana, Punjab",

    location_source: "citizen_gps",

    submitted_at: "2026-10-31T05:20:00Z",

    media_fingerprint: "demo-media-C",

    visual_similarity_matches: [
      {
        report_id: "RPT-203",
        score: 0.93
      }
    ]
  },


  // =====================================
  // REPORT 5 - ANOTHER DISTINCT SUBMISSION
  // =====================================

  {
    id: "RPT-205",

    reporter_ref: "DEMO_USER_05",

    disaster_type: "flood",

    latitude: 30.9020,
    longitude: 75.8560,

    claimed_location: "Ludhiana, Punjab",

    location_source: "citizen_gps",

    submitted_at: "2026-10-31T05:28:00Z",

    media_fingerprint: "demo-media-D",

    visual_similarity_matches: []
  },


  // =====================================
  // PATIALA - SEPARATE FLOOD EVENT
  // =====================================

  {
    id: "RPT-206",

    reporter_ref: "DEMO_USER_06",

    disaster_type: "flood",

    latitude: 30.3398,
    longitude: 76.3869,

    claimed_location: "Patiala, Punjab",

    location_source: "citizen_gps",

    submitted_at: "2026-10-31T07:00:00Z",

    media_fingerprint: "demo-media-E",

    visual_similarity_matches: []
  },


  // =====================================
  // MOHALI - DIFFERENT DISASTER TYPE
  // =====================================

  {
    id: "RPT-207",

    reporter_ref: "DEMO_USER_07",

    disaster_type: "waterlogging",

    latitude: 30.7046,
    longitude: 76.7179,

    claimed_location: "Mohali, Punjab",

    location_source: "place_name",

    submitted_at: "2026-10-31T06:00:00Z",

    media_fingerprint: "demo-media-F",

    visual_similarity_matches: []
  }

];
