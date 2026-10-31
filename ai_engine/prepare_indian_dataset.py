
from pathlib import Path
import pandas as pd
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INDIAN_DATASET_DIR = (
    PROJECT_ROOT / "datasets" / "raw" / "indian_disasters" / "raw"
)

OUTPUT_DIR = PROJECT_ROOT / "datasets" / "processed"

OUTPUT_PATH = OUTPUT_DIR / "indian_disasters_manifest.csv"

CLASS_MAPPING = {
    "MINOR": 1,
    "MAJOR": 1,
    "DESTROYED": 1
}

VALID_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp"
}


def main():

    print("\nSATYAMAP AI")
    print("INDIAN DISASTER DATASET PREPARATION")
    print("=" * 55)

    records = []

    for folder_name, label in CLASS_MAPPING.items():

        folder = INDIAN_DATASET_DIR / folder_name

        if not folder.is_dir():
            raise FileNotFoundError(folder)

        image_files = [
            path for path in folder.rglob("*")
            if path.is_file()
            and path.suffix.lower() in VALID_EXTENSIONS
        ]

        valid_count = 0
        invalid_count = 0

        for image_path in image_files:

            try:
                with Image.open(image_path) as image:
                    image.verify()

                records.append({
                    "image_path": str(image_path.resolve()),
                    "label": label,
                    "original_category": folder_name,
                    "event_name": "indian_disaster_damage",
                    "source": "AapdaSetu"
                })

                valid_count += 1

            except Exception:
                invalid_count += 1

        print(f"\n{folder_name}")
        print("Valid images:", valid_count)
        print("Invalid images:", invalid_count)

    dataframe = pd.DataFrame(records)

    if dataframe.empty:
        raise ValueError("No valid images found.")

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    dataframe.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\n" + "=" * 55)
    print("DATASET PREPARATION COMPLETE")
    print("=" * 55)

    print("Total valid images:", len(dataframe))
    print("Label distribution:")
    print(dataframe["label"].value_counts().to_dict())

    print("\nSaved to:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
