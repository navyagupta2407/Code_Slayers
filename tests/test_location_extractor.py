
import json
from pathlib import Path

from ai_engine.location_extractor import extract_location_metadata


PROJECT_ROOT = Path(__file__).resolve().parents[1]

TEST_IMAGES = [
    PROJECT_ROOT / "test_data" / "original" / "flood1.jpg",
    PROJECT_ROOT / "test_data" / "original" / "unrelated.jpg"
]


def main():
    print("=== SATYAMAP AI Location & EXIF Extraction ===")

    for image_path in TEST_IMAGES:

        print(f"\nAnalyzing: {image_path.name}")

        result = extract_location_metadata(
            image_path,
            claimed_location="Mohali, Punjab, India"
        )

        print(json.dumps(result, indent=4))

        assert "gps_metadata_available" in result
        assert "claimed_location" in result
        assert "requires_location_verification" in result

    print("\nLocation extraction tests completed!")


if __name__ == "__main__":
    main()
