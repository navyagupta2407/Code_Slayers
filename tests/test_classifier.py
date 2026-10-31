
import json
from pathlib import Path

from ai_engine.classifier import classify_disaster_image


PROJECT_ROOT = Path(__file__).resolve().parents[1]

TEST_IMAGES = [
    PROJECT_ROOT / "test_data" / "original" / "flood1.jpg",
    PROJECT_ROOT / "test_data" / "original" / "unrelated.jpg"
]


def main():
    print("=== SATYAMAP AI Disaster Classification ===")

    for image_path in TEST_IMAGES:

        print(f"\nAnalyzing: {image_path.name}")

        try:
            result = classify_disaster_image(image_path)

            print(json.dumps(result, indent=4))

        except Exception as error:
            print(f"Classification failed: {error}")
            raise

    print("\nClassification tests completed!")


if __name__ == "__main__":
    main()
