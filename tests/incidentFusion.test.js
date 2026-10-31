
import {
  describe,
  it,
  expect
} from "vitest";

import { demoReports } from "../src/data/demoReports";

import {
  calculateDistanceKm,
  calculateTimeDifferenceHours,
  checkMediaRelationship,
  compareReports,
  analyzeReportRelationships
} from "../src/lib/incidentFusion";


describe("DisasterLens AI - Incident Fusion Engine", () => {

  // TEST 1: Geographical distance
  it("calculates distance between nearby reports", () => {

    const reportA = demoReports[0];
    const reportB = demoReports[1];

    const distance = calculateDistanceKm(
      reportA,
      reportB
    );

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1);

  });


  // TEST 2: Invalid coordinates
  it("rejects reports with invalid coordinates", () => {

    const result = calculateDistanceKm(
      {
        latitude: 150,
        longitude: 75
      },
      demoReports[0]
    );

    expect(result).toBeNull();

  });


  // TEST 3: Time difference
  it("calculates submission time difference", () => {

    const difference = calculateTimeDifferenceHours(
      demoReports[0],
      demoReports[1]
    );

    expect(difference).toBeCloseTo(7 / 60, 5);

  });


  // TEST 4: Exact duplicate detection
  it("detects identical media fingerprints", () => {

    const result = checkMediaRelationship(
      demoReports[0],
      demoReports[1]
    );

    expect(result.relationship)
      .toBe("exact_duplicate");

    expect(result.similarity_score)
      .toBe(1);

  });


  // TEST 5: Possible visual duplicate
  it("detects AI-reported visual similarity", () => {

    const reportA = demoReports.find(
      report => report.id === "RPT-203"
    );

    const reportB = demoReports.find(
      report => report.id === "RPT-204"
    );

    const result = checkMediaRelationship(
      reportA,
      reportB
    );

    expect(result.relationship)
      .toBe("possible_duplicate");

    expect(result.similarity_score)
      .toBe(0.93);

  });


  // TEST 6: Same event candidate
  it("identifies nearby reports of the same disaster type", () => {

    const result = compareReports(
      demoReports[0],
      demoReports[2]
    );

    expect(result.eventRelationship)
      .toBe("potential_same_event");

    expect(result.requiresHumanReview)
      .toBe(true);

  });


  // TEST 7: Separate geographical event
  it("does not group distant incidents", () => {

    const ludhiana = demoReports.find(
      report => report.id === "RPT-201"
    );

    const patiala = demoReports.find(
      report => report.id === "RPT-206"
    );

    const result = compareReports(
      ludhiana,
      patiala
    );

    expect(result.eventRelationship)
      .toBe("not_grouped_by_current_rules");

  });


  // TEST 8: Complete fusion analysis
  it("generates correct candidate groups", () => {

    const result = analyzeReportRelationships(
      demoReports
    );

    expect(result.summary.totalReports)
      .toBe(7);

    expect(result.summary.comparedPairs)
      .toBe(21);

    expect(result.summary.candidateGroupCount)
      .toBe(1);

    expect(result.summary.duplicatePairCount)
      .toBe(2);

    expect(result.summary.corroborationPairCount)
      .toBe(8);

  });


  // TEST 9: Candidate group membership
  it("groups the five Ludhiana reports together", () => {

    const result = analyzeReportRelationships(
      demoReports
    );

    const group = result.candidateGroups[0];

    expect(group.reportIds).toEqual([
      "RPT-201",
      "RPT-202",
      "RPT-203",
      "RPT-204",
      "RPT-205"
    ]);

    expect(group.status)
      .toBe("candidate_only");

    expect(group.requiresHumanReview)
      .toBe(true);

  });


  // TEST 10: Unrelated reports remain ungrouped
  it("keeps separate reports outside candidate groups", () => {

    const result = analyzeReportRelationships(
      demoReports
    );

    expect(result.ungroupedReportIds).toContain(
      "RPT-206"
    );

    expect(result.ungroupedReportIds).toContain(
      "RPT-207"
    );

  });


  // TEST 11: Duplicate report IDs
  it("rejects duplicate report identifiers", () => {

    expect(() =>
      analyzeReportRelationships([
        demoReports[0],
        demoReports[0]
      ])
    ).toThrow("Every report must have a unique ID");

  });


  // TEST 12: Empty dataset
  it("handles an empty report dataset", () => {

    const result = analyzeReportRelationships([]);

    expect(result.summary.totalReports)
      .toBe(0);

    expect(result.candidateGroups)
      .toHaveLength(0);

  });

});
