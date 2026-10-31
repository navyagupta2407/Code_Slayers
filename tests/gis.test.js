
import {
  describe,
  it,
  expect
} from "vitest";

import { demoIncidents } from "../src/data/demoIncidents";

import {
  filterIncidents,
  hasValidCoords,
  summary,
  confidencePercent,
  normalizeIncident
} from "../src/lib/gis";


describe("India-wide GIS transformations", () => {

  // TEST 1: Verified incident filtering
  it("filters verified incidents correctly", () => {

    const result = filterIncidents(
      demoIncidents,
      { status: "verified" }
    );

    expect(
      result.every(
        item => item.verification_status === "verified"
      )
    ).toBe(true);

  });


  // TEST 2: Disaster type filtering
  it("filters flood incidents correctly", () => {

    const result = filterIncidents(
      demoIncidents,
      { type: "flood" }
    );

    expect(
      result.every(
        item => item.disaster_type === "flood"
      )
    ).toBe(true);

  });


  // TEST 3: GPS coordinate validation
  it("accepts valid GPS coordinates", () => {

    expect(
      hasValidCoords({
        latitude: 30.9009,
        longitude: 75.8573
      })
    ).toBe(true);

    expect(
      hasValidCoords({
        latitude: 90,
        longitude: 180
      })
    ).toBe(true);

  });


  // TEST 4: Reject invalid coordinates
  it("rejects invalid GPS coordinates", () => {

    expect(
      hasValidCoords({
        latitude: 150,
        longitude: 76
      })
    ).toBe(false);

    expect(
      hasValidCoords({
        latitude: 30,
        longitude: 200
      })
    ).toBe(false);

    expect(
      hasValidCoords({
        latitude: null,
        longitude: null
      })
    ).toBe(false);

    expect(hasValidCoords(null)).toBe(false);

  });


  // TEST 5: Dashboard summary
  it("calculates incident and report statistics", () => {

    const result = summary(demoIncidents);

    const expectedReports = demoIncidents.reduce(
      (total, item) =>
        total + (item.report_count || 0),
      0
    );

    const expectedDuplicates = demoIncidents.reduce(
      (total, item) =>
        total + (item.duplicate_report_count || 0),
      0
    );

    const expectedVerified = demoIncidents.filter(
      item =>
        item.verification_status === "verified"
    ).length;

    expect(result.incidents).toBe(
      demoIncidents.length
    );

    expect(result.reports).toBe(expectedReports);

    expect(result.duplicates).toBe(
      expectedDuplicates
    );

    expect(result.verified).toBe(expectedVerified);

  });


  // TEST 6: Confidence formatting
  it("formats AI confidence correctly", () => {

    expect(confidencePercent(0.94)).toBe("94%");

    expect(confidencePercent(0.78)).toBe("78%");

    expect(confidencePercent(94)).toBe("94%");

    expect(confidencePercent(null)).toBe("Unknown");

  });


  // TEST 7: Incident ID search
  it("searches incidents by ID", () => {

    const result = filterIncidents(
      demoIncidents,
      { search: "INC-001" }
    );

    // Prevent an empty array from passing automatically.
    expect(result.length).toBeGreaterThan(0);

    expect(
      result.every(
        item =>
          item.id.toLowerCase().includes("inc-001")
      )
    ).toBe(true);

  });


  // TEST 8: Backend schema normalization
  it("normalizes backend incident data correctly", () => {

    const backendIncident = {

      canonical_incident_id: "INC_900",

      incident_type: "flood",

      latitude: 30.9009,

      longitude: 75.8573,

      state: "Punjab",

      district: "Ludhiana",

      status: "verified",

      report_count: 3,

      ai_confidence: 0.92,

      duplicate_evidence: [
        {
          report_id: "RPT_002",
          duplicate_score: 0.95
        }
      ]

    };

    const result = normalizeIncident(
      backendIncident
    );

    expect(result.id).toBe("INC_900");

    expect(result.disaster_type).toBe("flood");

    expect(result.verification_status).toBe(
      "verified"
    );

    expect(result.duplicate_report_count).toBe(1);

    expect(result.state).toBe("Punjab");

  });


  // TEST 9: AI confidence filtering
  it("filters incidents using minimum AI confidence", () => {

    const incidents = [

      {
        id: "INC_A",
        ai_confidence: 0.90,
        verification_status: "verified"
      },

      {
        id: "INC_B",
        ai_confidence: 0.20,
        verification_status: "pending"
      }

    ];

    const result = filterIncidents(
      incidents,
      { minConfidence: 30 }
    );

    expect(result).toHaveLength(1);

    expect(result[0].id).toBe("INC_A");

  });


  // TEST 10: State and district search
  it("searches incidents by district", () => {

    const incidents = [

      {
        id: "INC_A",
        state: "Punjab",
        district: "Ludhiana"
      },

      {
        id: "INC_B",
        state: "Haryana",
        district: "Ambala"
      }

    ];

    const result = filterIncidents(
      incidents,
      { search: "ludhiana" }
    );

    expect(result).toHaveLength(1);

    expect(result[0].id).toBe("INC_A");

  });


  // TEST 11: Duplicate evidence fallback
  it("counts linked duplicate evidence when explicit count is missing", () => {

    const incident = normalizeIncident({

      id: "INC_DUP",

      incident_type: "flood",

      duplicate_evidence: [
        {
          report_id: "RPT_001",
          duplicate_score: 0.95
        },
        {
          report_id: "RPT_002",
          duplicate_score: 0.91
        }

      ]

    });

    expect(
      incident.duplicate_report_count
    ).toBe(2);

  });

});
