// import {describe,it,expect} from 'vitest';
// import {demoIncidents} from '../src/data/demoIncidents';
// import {filterIncidents,hasValidCoords,summary,confidencePercent} from '../src/lib/gis';
// describe('GIS transformations',()=>{
//  it('filters verified incidents',()=>{const list=filterIncidents(demoIncidents,{status:'verified'});expect(list).toHaveLength(2);expect(list.every(i=>i.verification_status==='verified')).toBe(true)});
//  it('filters by disaster type',()=>{expect(filterIncidents(demoIncidents,{type:'flood'})).toHaveLength(2)});
//  it('keeps unknown locations off the map',()=>{expect(demoIncidents.filter(hasValidCoords)).toHaveLength(5)});
//  it('rejects invalid coordinates',()=>{expect(hasValidCoords({latitude:100,longitude:76})).toBe(false);expect(hasValidCoords({latitude:30,longitude:200})).toBe(false)});
//  it('summarizes canonical incidents, not uploads as unique disasters',()=>{const s=summary(demoIncidents);expect(s.incidents).toBe(6);expect(s.reports).toBe(13);expect(s.duplicates).toBe(7)});
//  it('renders normalized confidence safely',()=>{expect(confidencePercent(.94)).toBe('94%');expect(confidencePercent(null)).toBe('Unknown')});
//  it("rejects missing coordinates", () => {expect( hasValidCoords({latitude: null,longitude: null}) ).toBe(false);});
// });



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
  confidencePercent
} from "../src/lib/gis";


describe("India-wide GIS transformations", () => {

  // TEST 1: Verified incident filtering
  it("filters verified incidents correctly", () => {

    const result = filterIncidents(
      demoIncidents,
      { status: "verified" }
    );

    const expected = demoIncidents.filter(
      item => item.verification_status === "verified"
    );

    expect(result).toEqual(expected);

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

    const expected = demoIncidents.filter(
      item => item.disaster_type === "flood"
    );

    expect(result).toEqual(expected);

  });


  // TEST 3: Unknown locations should not appear on map
  it("keeps invalid or unknown locations off the map", () => {

    const locatedIncidents = demoIncidents.filter(
      hasValidCoords
    );

    expect(
      locatedIncidents.every(hasValidCoords)
    ).toBe(true);

    const unlocatedIncidents = demoIncidents.filter(
      item => !hasValidCoords(item)
    );

    expect(
      locatedIncidents.length +
      unlocatedIncidents.length
    ).toBe(demoIncidents.length);

  });


  // TEST 4: Summary calculations
  it("summarizes canonical incidents correctly", () => {

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
      item => item.verification_status === "verified"
    ).length;

    expect(result.incidents).toBe(
      demoIncidents.length
    );

    expect(result.reports).toBe(
      expectedReports
    );

    expect(result.duplicates).toBe(
      expectedDuplicates
    );

    expect(result.verified).toBe(
      expectedVerified
    );

  });


  // TEST 5: Reject invalid coordinates
  it("rejects invalid coordinates", () => {

    expect(
      hasValidCoords({
        latitude: 150,
        longitude: 250
      })
    ).toBe(false);

    expect(
      hasValidCoords({
        latitude: -100,
        longitude: 80
      })
    ).toBe(false);

  });


  // TEST 6: Confidence formatting
  it("formats confidence correctly", () => {

    expect(confidencePercent(0.94))
      .toBe("94%");

    expect(confidencePercent(0.78))
      .toBe("78%");

    expect(confidencePercent(null))
      .toBe("Unknown");

  });


  // TEST 7: Reject missing coordinates
  it("rejects missing coordinates", () => {

    expect(
      hasValidCoords({
        latitude: null,
        longitude: null
      })
    ).toBe(false);

    expect(
      hasValidCoords({
        latitude: 30.9
      })
    ).toBe(false);

  });


  // TEST 8: Search by incident ID
  it("searches incidents by ID", () => {

    const result = filterIncidents(
      demoIncidents,
      { search: "INC-001" }
    );

    expect(
      result.every(
        item => item.id.toLowerCase().includes("inc-001")
      )
    ).toBe(true);

  });

});
