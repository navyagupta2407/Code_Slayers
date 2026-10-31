
from pathlib import Path
import json
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent

PREDICTIONS_PATH = (
    PROJECT_ROOT
    / "reports"
    / "california_wildfire_predictions.csv"
)

ANNOTATION_DIR = (
    PROJECT_ROOT
    / "datasets"
    / "raw"
    / "crisismmd"
    / "informative"
)

OUTPUT_PATH = (
    PROJECT_ROOT
    / "reports"
    / "california_annotation_audit.csv"
)


def normalize_image_path(image_path):
    """
    Convert absolute and relative image paths into
    the same normalized data_image/... format.
    """

    path = str(image_path).replace("\\", "/")

    marker = "data_image/"

    if marker in path:
        return path.split(marker, 1)[1].lower()

    return path.lower()


def main():

    print("\nSATYAMAP AI")
    print("CALIFORNIA ANNOTATION AUDIT")
    print("=" * 60)

    if not PREDICTIONS_PATH.is_file():
        raise FileNotFoundError(PREDICTIONS_PATH)

    predictions = pd.read_csv(PREDICTIONS_PATH)

    errors = predictions[
        predictions["correct"] == False
    ].copy()

    print("\nIncorrect predictions:", len(errors))

    # --------------------------------------
    # LOAD ORIGINAL ANNOTATIONS
    # --------------------------------------

    annotation_lookup = {}

    annotation_files = list(
        ANNOTATION_DIR.glob("*.json")
    )

    print(
        "Annotation files:",
        [file.name for file in annotation_files]
    )

    for file_path in annotation_files:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            records = json.load(file)

        if not isinstance(records, list):
            raise ValueError(
                f"Unexpected JSON format in {file_path}"
            )

        for record in records:

            image_path = record.get("image_path")

            if not image_path:
                continue

            key = normalize_image_path(image_path)

            annotation_lookup[key] = {

                "tweet_id": record.get("tweet_id"),

                "tweet_text": record.get("tweet_text"),

                "original_label": record.get("label"),

                "event_name": record.get("event_name"),

                "image_id": record.get("image_id")

            }

    print(
        "\nOriginal annotations loaded:",
        len(annotation_lookup)
    )

    # --------------------------------------
    # MATCH PREDICTIONS WITH ANNOTATIONS
    # --------------------------------------

    audit_rows = []

    for _, prediction in errors.iterrows():

        key = normalize_image_path(
            prediction["image_path"]
        )

        original = annotation_lookup.get(key, {})

        audit_rows.append({

            "image_path": prediction["image_path"],

            "image_id": original.get("image_id"),

            "tweet_id": original.get("tweet_id"),

            "tweet_text": original.get("tweet_text"),

            "original_label": prediction["actual_label"],

            "annotation_label": original.get("original_label"),

            "model_prediction": prediction["predicted_label"],

            "model_confidence": prediction["confidence"],

            "informative_probability": prediction[
                "informative_probability"
            ],

            "error_type": prediction["error_type"],

            "annotation_matched": bool(original)

        })

    audit = pd.DataFrame(audit_rows)

    # --------------------------------------
    # SAVE AUDIT
    # --------------------------------------

    audit.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    matched = int(
        audit["annotation_matched"].sum()
    )

    print("\nANNOTATION MATCHING RESULTS")

    print(
        f"Incorrect predictions: {len(audit)}"
    )

    print(
        f"Successfully matched: {matched}"
    )

    print(
        f"Unmatched: {len(audit) - matched}"
    )

    print("\nERROR TYPE DISTRIBUTION")

    print(
        audit["error_type"].value_counts()
    )

    print("\nSAMPLE INCORRECT PREDICTIONS")

    columns = [
        "original_label",
        "model_prediction",
        "tweet_text",
        "error_type"
    ]

    print(
        audit[columns].head(15).to_string(
            index=False
        )
    )

    print("\nAUDIT SAVED TO:")

    print(OUTPUT_PATH)

    print("\nAnnotation audit completed!")


if __name__ == "__main__":
    main()
