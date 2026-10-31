
import json
import csv
from pathlib import Path
from collections import Counter

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATASET_ROOT = PROJECT_ROOT / "datasets" / "raw" / "crisismmd"

OUTPUT_DIR = PROJECT_ROOT / "datasets" / "processed"

OUTPUT_FILE = OUTPUT_DIR / "crisismmd_manifest.csv"

# Event-level split assignment
EVENT_SPLITS = {
    "hurricane_harvey": "train",
    "hurricane_irma": "train",
    "hurricane_maria": "train",
    "srilanka_floods": "train",
    "iraq_iran_earthquake": "train",

    "california_wildfires": "validation",

    "mexico_earthquake": "test",
}

# Binary labels
LABEL_MAP = {
    "not_informative": 0,
    "informative": 1,
}

OFFICIAL_SPLITS = ["train", "dev", "test"]


# --------------------------------------------------
# MAIN PREPROCESSING FUNCTION
# --------------------------------------------------

def prepare_dataset():

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []

    label_counts = Counter()
    split_counts = Counter()
    event_counts = Counter()

    missing_images = []
    unknown_labels = []
    unknown_events = []

    seen_image_ids = set()
    seen_tweet_assignments = {}

    print("\nSATYAMAP AI DATASET PREPROCESSING")
    print("=" * 60)

    # Read official annotation files
    for official_split in OFFICIAL_SPLITS:

        annotation_file = (
            DATASET_ROOT
            / "informative"
            / f"{official_split}.json"
        )

        print(f"\nReading: {annotation_file.name}")

        with open(annotation_file, "r", encoding="utf-8") as file:
            records = json.load(file)

        print("Records found:", len(records))

        for record in records:

            event_name = record["event_name"]
            image_id = str(record["image_id"])
            tweet_id = str(record["tweet_id"])
            original_label = record["label"]

            # Check event assignment
            if event_name not in EVENT_SPLITS:
                unknown_events.append(event_name)
                continue

            assigned_split = EVENT_SPLITS[event_name]

            # Check label
            if original_label not in LABEL_MAP:
                unknown_labels.append(original_label)
                continue

            binary_label = LABEL_MAP[original_label]

            # Prevent duplicate image IDs
            if image_id in seen_image_ids:
                print("Duplicate image skipped:", image_id)
                continue

            seen_image_ids.add(image_id)

            # Ensure all images of one tweet stay together
            previous_assignment = seen_tweet_assignments.get(tweet_id)

            if (
                previous_assignment is not None
                and previous_assignment != assigned_split
            ):
                raise ValueError(
                    f"Tweet leakage detected: {tweet_id}"
                )

            seen_tweet_assignments[tweet_id] = assigned_split

            # Resolve image path
            relative_image_path = record["image_path"]

            absolute_image_path = (
                DATASET_ROOT / relative_image_path
            ).resolve()

            if not absolute_image_path.is_file():
                missing_images.append(relative_image_path)
                continue

            # Store clean record
            manifest.append({
                "image_id": image_id,
                "tweet_id": tweet_id,
                "event_name": event_name,
                "image_path": str(absolute_image_path),
                "original_label": original_label,
                "label": binary_label,
                "split": assigned_split,
            })

            label_counts[(assigned_split, binary_label)] += 1
            split_counts[assigned_split] += 1
            event_counts[event_name] += 1

    # --------------------------------------------------
    # VALIDATION
    # --------------------------------------------------

    if unknown_events:
        raise ValueError(
            f"Unknown events found: {set(unknown_events)}"
        )

    if unknown_labels:
        raise ValueError(
            f"Unknown labels found: {set(unknown_labels)}"
        )

    if missing_images:
        raise FileNotFoundError(
            f"{len(missing_images)} images are missing. "
            f"First examples: {missing_images[:5]}"
        )

    # --------------------------------------------------
    # WRITE CSV MANIFEST
    # --------------------------------------------------

    fieldnames = [
        "image_id",
        "tweet_id",
        "event_name",
        "image_path",
        "original_label",
        "label",
        "split",
    ]

    with open(
        OUTPUT_FILE,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(manifest)

    # --------------------------------------------------
    # PRINT SUMMARY
    # --------------------------------------------------

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)

    print("Total images:", len(manifest))
    print("Unique image IDs:", len(seen_image_ids))
    print("Missing images:", len(missing_images))

    print("\nSPLIT DISTRIBUTION")

    for split in ["train", "validation", "test"]:

        print(f"\n{split.upper()}")

        print("Total:", split_counts[split])

        print(
            "Informative:",
            label_counts[(split, 1)]
        )

        print(
            "Not informative:",
            label_counts[(split, 0)]
        )

    print("\nEVENT DISTRIBUTION")

    for event, count in sorted(event_counts.items()):
        print(event, ":", count)

    print("\nManifest saved at:")
    print(OUTPUT_FILE)


if __name__ == "__main__":
    prepare_dataset()

