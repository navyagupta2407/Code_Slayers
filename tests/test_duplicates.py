
from pathlib import Path

from ai_engine.duplicate_detector import (
    calculate_hash,
    compare_images,
    find_duplicates
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

original = (
    PROJECT_ROOT
    / "test_data"
    / "original"
    / "flood1.jpg"
)

duplicate = (
    PROJECT_ROOT
    / "test_data"
    / "duplicates"
    / "flood1_copy.jpg"
)


def main():
    print("=== SATYAMAP AI Duplicate Detector ===")

    # Test 1: Calculate the original image hash
    original_hash = calculate_hash(original)

    print("\nOriginal image hash:")
    print(original_hash)

    # Test 2: Compare two images
    comparison = compare_images(original, duplicate)

    print("\nImage comparison result:")
    print(comparison)

    # Test 3: Search existing reports
    existing_reports = {
        "RPT_001": original
    }

    result = find_duplicates(
        duplicate,
        existing_reports
    )

    print("\nDuplicate search result:")
    print(result)


if __name__ == "__main__":
    main()
