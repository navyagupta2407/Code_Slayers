
import json
from pathlib import Path

from ai_engine.evidence_engine import analyze_evidence


PROJECT_ROOT = Path(__file__).resolve().parents[1]

FLOOD_IMAGE = (
    PROJECT_ROOT / "test_data" / "original" / "flood1.jpg"
)

UNRELATED_IMAGE = (
    PROJECT_ROOT / "test_data" / "original" / "unrelated.jpg"
)

# Simulate one previously submitted report.
EXISTING_IMAGES = {
    "RPT_TEST_001": FLOOD_IMAGE
}


def run_test(image_path):

    print(f"\nAnalyzing: {image_path.name}")

    result = analyze_evidence(
        image_path=image_path,
        existing_images=EXISTING_IMAGES,
        claimed_location="Mohali, Punjab, India"
    )

    print(json.dumps(result, indent=4))

    # Check the structure of the final result.
    assert result["analysis_status"] == "completed"

    assert "duplicate_detection" in result
    assert "historical_analysis" in result
    assert "disaster_classification" in result
    assert "location_analysis" in result
    assert "evidence_summary" in result

    assert isinstance(
        result["evidence_summary"]["requires_human_review"],
        bool
    )

    return result


def main():

    print("=== SATYAMAP AI EVIDENCE FUSION TEST ===")

    print("\nTEST 1: Flood image")
    flood_result = run_test(FLOOD_IMAGE)

    print("\nTEST 2: Unrelated image")
    unrelated_result = run_test(UNRELATED_IMAGE)

    print("\n=== TEST SUMMARY ===")

    print(
        "Flood classification:",
        flood_result["evidence_summary"]["possible_disaster_type"]
    )

    print(
        "Unrelated classification:",
        unrelated_result["evidence_summary"]["possible_disaster_type"]
    )

    print(
        "Flood human review:",
        flood_result["evidence_summary"]["requires_human_review"]
    )

    print(
        "Unrelated human review:",
        unrelated_result["evidence_summary"]["requires_human_review"]
    )

    print("\nEvidence Fusion tests completed successfully!")


if __name__ == "__main__":
    main()
