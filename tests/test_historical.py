
import json
from pathlib import Path

from ai_engine.historical_matcher import (
    check_historical_image
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Image that exists in our historical database
uploaded_image = (
    PROJECT_ROOT
    / "test_data"
    / "original"
    / "flood1.jpg"
)

# Completely unrelated image
unrelated_image = (
    PROJECT_ROOT
    / "test_data"
    / "original"
    / "unrelated.jpg"
)


def main():

    print("=== SATYAMAP AI Historical Detection ===")

    # TEST 1: Historical image match
    print("\nTEST 1: Historical image detection")

    result = check_historical_image(uploaded_image)

    print(json.dumps(result, indent=4))

    assert result["historical_match"] is True

    print("Historical matching test PASSED!")

    # TEST 2: Unrelated image
    print("\nTEST 2: Unrelated image detection")

    negative_result = check_historical_image(unrelated_image)

    print(json.dumps(negative_result, indent=4))

    assert negative_result["historical_match"] is False

    print("Unrelated image test PASSED!")

    print("\nAll historical detection tests completed!")


if __name__ == "__main__":
    main()
