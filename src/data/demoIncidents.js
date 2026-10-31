// FAKE reports for the hackathon demo only; not real disaster alerts.
export const demoIncidents = [
  {id:'INC-001',title:'Flooded street reported in Ludhiana',latitude:30.9009,longitude:75.8573,state: "Punjab",disaster_type:'flood',verification_status:'verified',ai_confidence:0.94,location_confidence:0.91,location_source:'citizen_gps',severity:'high',report_count:5,duplicate_report_count:4,created_at:'2026-10-31T05:00:00Z',description:'Multiple reports show water covering a road. Demo incident.',reports:[{id:'REP-101',label:'Citizen photo A',similarity:'primary'},{id:'REP-102',label:'Citizen photo B',similarity:'visually similar'},{id:'REP-103',label:'Citizen photo C',similarity:'same incident'},{id:'REP-104',label:'Citizen photo D',similarity:'same incident'},{id:'REP-105',label:'Citizen photo E',similarity:'same incident'}]},
  {id:'INC-002',title:'Waterlogging reported near Mohali',latitude:30.7046,longitude:76.7179,state: "Punjab",disaster_type:'waterlogging',verification_status:'pending',ai_confidence:0.72,location_confidence:0.73,location_source:'place_name',severity:'medium',report_count:2,duplicate_report_count:1,created_at:'2026-10-31T06:00:00Z',description:'Needs location review before verification.',reports:[{id:'REP-106',label:'Citizen photo',similarity:'primary'},{id:'REP-107',label:'Second photo',similarity:'same incident'}]},
  {id:'INC-003',title:'Storm damage reported in Patiala',latitude:30.3398,longitude:76.3869,state: "Punjab",disaster_type:'storm',verification_status:'verified',ai_confidence:0.91,location_confidence:0.88,location_source:'citizen_gps',severity:'high',report_count:1,duplicate_report_count:0,created_at:'2026-10-31T07:00:00Z',description:'An officer reviewed the synthetic report.',reports:[{id:'REP-108',label:'Photo of damage',similarity:'primary'}]},
  {id:'INC-004',title:'Rain damage reported in Jalandhar',latitude:31.3260,longitude:75.5762,state: "Punjab",disaster_type:'rain',verification_status:'pending',ai_confidence:0.61,location_confidence:0.67,location_source:'estimated',severity:'low',report_count:3,duplicate_report_count:2,created_at:'2026-10-31T07:30:00Z',description:'Exact location not confirmed.',reports:[{id:'REP-109',label:'Original media',similarity:'primary'},{id:'REP-110',label:'Repeated image',similarity:'exact duplicate'},{id:'REP-111',label:'Related image',similarity:'same incident'}]},
  {id:'INC-005',title:'Old photo submitted for Amritsar',latitude:31.6340,longitude:74.8723,state: "Punjab",disaster_type:'flood',verification_status:'rejected',ai_confidence:0.20,location_confidence:0.45,location_source:'estimated',severity:'unknown',report_count:1,duplicate_report_count:0,created_at:'2026-10-31T08:00:00Z',description:'Synthetic example of rejected stale evidence.',reports:[{id:'REP-112',label:'Previously circulated image',similarity:'primary'}]},
  {id:'INC-006',title:'Report pending location verification',latitude:null,longitude:null,disaster_type:'storm',verification_status:'pending',ai_confidence:0.58,location_confidence:null,location_source:'unknown',severity:'unknown',report_count:1,duplicate_report_count:0,created_at:'2026-10-31T08:20:00Z',description:'No coordinates; do not pin to a fabricated location.',reports:[{id:'REP-113',label:'Unlocated report',similarity:'primary'}]},
  {id: "INC-007",
  title: "Flood demonstration - Mumbai",
  description: "Synthetic flood report for testing",
  latitude: 19.0760,
  longitude: 72.8777,
  state: "Maharashtra",
  disaster_type: "flood",
  verification_status: "pending",
  ai_confidence: 0.86,
  location_confidence: 0.80,
  location_source: "demo_city_center",
  severity: "high",
  report_count: 3,
  duplicate_report_count: 2,
  created_at: "2026-10-31T08:00:00Z",
  reports: []
},
{
  id: "INC-008",
  title: "Storm demonstration - Chennai",
  description: "Synthetic storm report for testing",
  latitude: 13.0827,
  longitude: 80.2707,
  state: "Tamil Nadu",
  disaster_type: "storm",
  verification_status: "pending",
  ai_confidence: 0.78,
  location_confidence: 0.80,
  location_source: "demo_city_center",
  severity: "medium",
  report_count: 2,
  duplicate_report_count: 1,
  created_at: "2026-10-31T08:30:00Z",
  reports: []
},
{
  id: "INC-009",
  title: "Flood demonstration - Kolkata",
  description: "Synthetic flood report for testing",
  latitude: 22.5726,
  longitude: 88.3639,
  state: "West Bengal",
  disaster_type: "flood",
  verification_status: "verified",
  ai_confidence: 0.92,
  location_confidence: 0.85,
  location_source: "demo_city_center",
  severity: "high",
  report_count: 4,
  duplicate_report_count: 3,
  created_at: "2026-10-31T09:00:00Z",
  reports: []
},
{
  id: "INC-010",
  title: "Heavy rainfall demonstration - Bengaluru",
  description: "Synthetic rainfall report for testing",
  latitude: 12.9716,
  longitude: 77.5946,
  state: "Karnataka",
  disaster_type: "rain",
  verification_status: "pending",
  ai_confidence: 0.81,
  location_confidence: 0.80,
  location_source: "demo_city_center",
  severity: "medium",
  report_count: 2,
  duplicate_report_count: 1,
  created_at: "2026-10-31T09:15:00Z",
  reports: []
},
{
  id: "INC-011",
  title: "Flood demonstration - Guwahati",
  description: "Synthetic flood report for testing",
  latitude: 26.1445,
  longitude: 91.7362,
  state: "Assam",
  disaster_type: "flood",
  verification_status: "pending",
  ai_confidence: 0.89,
  location_confidence: 0.82,
  location_source: "demo_city_center",
  severity: "high",
  report_count: 5,
  duplicate_report_count: 4,
  created_at: "2026-10-31T09:30:00Z",
  reports: []
},
{
  id: "INC-012",
  title: "Storm demonstration - Jaipur",
  description: "Synthetic storm report for testing",
  latitude: 26.9124,
  longitude: 75.7873,
  state: "Rajasthan",
  disaster_type: "storm",
  verification_status: "verified",
  ai_confidence: 0.93,
  location_confidence: 0.85,
  location_source: "demo_city_center",
  severity: "medium",
  report_count: 3,
  duplicate_report_count: 2,
  created_at: "2026-10-31T10:00:00Z",
  reports: []
},
{
  id: "INC-013",
  title: "Flood demonstration - Patna",
  description: "Synthetic flood report for testing",
  latitude: 25.5941,
  longitude: 85.1376,
  state: "Bihar",
  disaster_type: "flood",
  verification_status: "pending",
  ai_confidence: 0.87,
  location_confidence: 0.80,
  location_source: "demo_city_center",
  severity: "high",
  report_count: 2,
  duplicate_report_count: 1,
  created_at: "2026-10-31T10:30:00Z",
  reports: []
},
{
  id: "INC-014",
  title: "Rainfall demonstration - Hyderabad",
  description: "Synthetic rainfall report for testing",
  latitude: 17.3850,
  longitude: 78.4867,
  state: "Telangana",
  disaster_type: "rain",
  verification_status: "verified",
  ai_confidence: 0.91,
  location_confidence: 0.84,
  location_source: "demo_city_center",
  severity: "low",
  report_count: 1,
  duplicate_report_count: 0,
  created_at: "2026-10-31T11:00:00Z",
  reports: []
},
{
  id: "INC-015",
  title: "Landslide demonstration - Shimla",
  description: "Synthetic landslide report for testing",
  latitude: 31.1048,
  longitude: 77.1734,
  state: "Himachal Pradesh",
  disaster_type: "landslide",
  verification_status: "pending",
  ai_confidence: 0.88,
  location_confidence: 0.80,
  location_source: "demo_city_center",
  severity: "high",
  report_count: 2,
  duplicate_report_count: 1,
  created_at: "2026-10-31T11:30:00Z",
  reports: []
},
{
  id: "INC-016",
  title: "Flood demonstration - Srinagar",
  description: "Synthetic flood report for testing",
  latitude: 34.0837,
  longitude: 74.7973,
  state: "Jammu and Kashmir",
  disaster_type: "flood",
  verification_status: "pending",
  ai_confidence: 0.85,
  location_confidence: 0.80,
  location_source: "demo_city_center",
  severity: "high",
  report_count: 2,
  duplicate_report_count: 1,
  created_at: "2026-10-31T12:00:00Z",
  reports: []
},
{
  id: "INC-017",
  title: "Flooding in Amritsar",
  latitude: 31.6340,
  longitude: 74.8723,
  disaster_type: "flood",
  state: "Punjab",

  verification_status: "pending",
  ai_confidence: 0.78,
  location_confidence: 0.80,
  location_source: "place_name",
  severity: "medium",
  report_count: 2,
  duplicate_report_count: 1,
  created_at: "2026-10-31T09:00:00Z",
  description: "Synthetic demonstration record.",
  reports: [
    {
      id: "REP-114",
      label: "Citizen photograph",
      similarity: "primary"
    },
    {
      id: "REP-115",
      label: "Related photograph",
      similarity: "same incident"
    }
  ]
}

];

/* =========================================
   NATIONWIDE SYNTHETIC DEMO DATA
   Additional 25 records:
   18 missing states/territories + 7 UTs
========================================= */

const nationwideDemoSeeds = [

  // 18 missing states

  {
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    latitude: 17.6868,
    longitude: 83.2185,
    disaster_type: "cyclone"
  },
  {
    city: "Itanagar",
    district: "Papum Pare",
    state: "Arunachal Pradesh",
    latitude: 27.0844,
    longitude: 93.6053,
    disaster_type: "landslide"
  },
  {
    city: "Raipur",
    district: "Raipur",
    state: "Chhattisgarh",
    latitude: 21.2514,
    longitude: 81.6296,
    disaster_type: "heatwave"
  },
  {
    city: "Panaji",
    district: "North Goa",
    state: "Goa",
    latitude: 15.4909,
    longitude: 73.8278,
    disaster_type: "storm"
  },
  {
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    latitude: 23.0225,
    longitude: 72.5714,
    disaster_type: "heatwave"
  },
  {
    city: "Gurugram",
    district: "Gurugram",
    state: "Haryana",
    latitude: 28.4595,
    longitude: 77.0266,
    disaster_type: "waterlogging"
  },
  {
    city: "Ranchi",
    district: "Ranchi",
    state: "Jharkhand",
    latitude: 23.3441,
    longitude: 85.3096,
    disaster_type: "flood"
  },
  {
    city: "Kochi",
    district: "Ernakulam",
    state: "Kerala",
    latitude: 9.9312,
    longitude: 76.2673,
    disaster_type: "flood"
  },
  {
    city: "Bhopal",
    district: "Bhopal",
    state: "Madhya Pradesh",
    latitude: 23.2599,
    longitude: 77.4126,
    disaster_type: "drought"
  },
  {
    city: "Imphal",
    district: "Imphal West",
    state: "Manipur",
    latitude: 24.8170,
    longitude: 93.9368,
    disaster_type: "landslide"
  },
  {
    city: "Shillong",
    district: "East Khasi Hills",
    state: "Meghalaya",
    latitude: 25.5788,
    longitude: 91.8933,
    disaster_type: "rain"
  },
  {
    city: "Aizawl",
    district: "Aizawl",
    state: "Mizoram",
    latitude: 23.7271,
    longitude: 92.7176,
    disaster_type: "storm"
  },
  {
    city: "Kohima",
    district: "Kohima",
    state: "Nagaland",
    latitude: 25.6751,
    longitude: 94.1086,
    disaster_type: "landslide"
  },
  {
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    latitude: 20.2961,
    longitude: 85.8245,
    disaster_type: "cyclone"
  },
  {
    city: "Gangtok",
    district: "Gangtok",
    state: "Sikkim",
    latitude: 27.3314,
    longitude: 88.6138,
    disaster_type: "landslide"
  },
  {
    city: "Agartala",
    district: "West Tripura",
    state: "Tripura",
    latitude: 23.8315,
    longitude: 91.2868,
    disaster_type: "flood"
  },
  {
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    latitude: 26.8467,
    longitude: 80.9462,
    disaster_type: "heatwave"
  },
  {
    city: "Dehradun",
    district: "Dehradun",
    state: "Uttarakhand",
    latitude: 30.3165,
    longitude: 78.0322,
    disaster_type: "landslide"
  },

  // 7 missing Union Territories

  {
    city: "Sri Vijaya Puram",
    district: "South Andaman",
    state: "Andaman and Nicobar Islands",
    latitude: 11.6234,
    longitude: 92.7265,
    disaster_type: "cyclone"
  },
  {
    city: "Chandigarh",
    district: "Chandigarh",
    state: "Chandigarh",
    latitude: 30.7333,
    longitude: 76.7794,
    disaster_type: "rain"
  },
  {
    city: "Silvassa",
    district: "Dadra and Nagar Haveli",
    state: "Dadra and Nagar Haveli and Daman and Diu",
    latitude: 20.2766,
    longitude: 73.0083,
    disaster_type: "storm"
  },
  {
    city: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    disaster_type: "heatwave"
  },
  {
    city: "Leh",
    district: "Leh",
    state: "Ladakh",
    latitude: 34.1526,
    longitude: 77.5771,
    disaster_type: "coldwave"
  },
  {
    city: "Kavaratti",
    district: "Lakshadweep",
    state: "Lakshadweep",
    latitude: 10.5667,
    longitude: 72.6417,
    disaster_type: "cyclone"
  },
  {
    city: "Puducherry",
    district: "Puducherry",
    state: "Puducherry",
    latitude: 11.9416,
    longitude: 79.8083,
    disaster_type: "storm"
  }

];

const demoStatuses = [
  "pending",
  "verified",
  "rejected"
];

const demoSeverities = [
  "high",
  "medium",
  "low"
];

const demoConfidences = [
  0.88,
  0.76,
  0.93,
  0.69,
  0.84
];

// Generate synthetic demonstration incidents.
demoIncidents.push(
  ...nationwideDemoSeeds.map((seed, index) => ({

    id: `INC-${String(index + 18).padStart(3, "0")}`,

    title: `${seed.disaster_type} demonstration - ${seed.city}`,

    description:
      "Synthetic demonstration record for GIS testing. Not a real disaster alert.",

    ...seed,

    verification_status:
      demoStatuses[index % demoStatuses.length],

    ai_confidence:
      demoConfidences[index % demoConfidences.length],

    location_confidence: 0.80,

    location_source: "demo_city_center",

    severity:
      demoSeverities[index % demoSeverities.length],

    report_count: 1 + (index % 4),

    duplicate_report_count: index % 3,

    created_at: new Date(
      Date.UTC(2026, 9, 31, 12 + index, 0, 0)
    ).toISOString(),

    reports: []

  }))
);

