
from pathlib import Path
import json
import shutil

import pandas as pd
import torch

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score
)

import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ai_engine.predict import (
    load_model,
    transform,
    CLASS_NAMES,
    DEVICE
)

# ==========================================
# CONFIGURATION
# ==========================================

MANIFEST_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "processed"
    / "crisismmd_manifest.csv"
)

OUTPUT_DIR = PROJECT_ROOT / "reports"

SAMPLE_DIR = (
    OUTPUT_DIR
    / "california_error_samples"
)

EVENT_NAME = "california_wildfires"
SPLIT_NAME = "validation"

MAX_SAMPLES_PER_ERROR_TYPE = 20

LABEL_TO_ID = {
    "not_informative": 0,
    "informative": 1
}


# ==========================================
# IMAGE PATH RESOLUTION
# ==========================================

def resolve_image_path(image_path):

    path = Path(str(image_path))

    if path.is_file():
        return path

    path = PROJECT_ROOT / path

    if path.is_file():
        return path

    raise FileNotFoundError(
        f"Image not found: {image_path}"
    )


# ==========================================
# MAIN EVALUATION
# ==========================================

def main():

    print("\nSATYAMAP AI")
    print("CALIFORNIA WILDFIRE ERROR ANALYSIS")
    print("=" * 60)

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------
    # 1. LOAD MANIFEST
    # --------------------------------------

    if not MANIFEST_PATH.is_file():
        raise FileNotFoundError(
            f"Manifest not found: {MANIFEST_PATH}"
        )

    dataframe = pd.read_csv(MANIFEST_PATH)

    california_data = dataframe[
        (dataframe["event_name"] == EVENT_NAME)
        & (dataframe["split"] == SPLIT_NAME)
    ].copy()

    if california_data.empty:
        raise ValueError(
            "No California wildfire validation images found."
        )

    california_data = california_data.reset_index(drop=True)

    print(
        f"\nCalifornia validation images: "
        f"{len(california_data)}"
    )

    print("\nActual label distribution:")
    print(
        california_data["original_label"].value_counts()
    )

    # --------------------------------------
    # 2. LOAD MODEL ONCE
    # --------------------------------------

    print("\nLoading MobileNetV3-Small...")

    model = load_model()

    print("Model loaded successfully!")

    # --------------------------------------
    # 3. PREDICT EVERY IMAGE
    # --------------------------------------

    results = []

    failed_images = []

    model.eval()

    for index, row in california_data.iterrows():

        image_path = resolve_image_path(
            row["image_path"]
        )

        actual_label = str(
            row["original_label"]
        ).strip()

        if actual_label not in LABEL_TO_ID:
            raise ValueError(
                f"Unexpected label: {actual_label}"
            )

        try:

            from PIL import Image

            with Image.open(image_path) as image:
                image = image.convert("RGB")
                image_tensor = transform(image).unsqueeze(0)

            image_tensor = image_tensor.to(DEVICE)

            with torch.inference_mode():

                outputs = model(image_tensor)

                probabilities = torch.softmax(
                    outputs,
                    dim=1
                )[0]

            predicted_id = int(
                torch.argmax(probabilities).item()
            )

            predicted_label = CLASS_NAMES[predicted_id]

            confidence = float(
                probabilities[predicted_id].item()
            )

            informative_probability = float(
                probabilities[1].item()
            )

            actual_id = LABEL_TO_ID[actual_label]

            correct = predicted_id == actual_id

            results.append({

                "image_path": str(image_path),

                "actual_label": actual_label,

                "predicted_label": predicted_label,

                "actual_id": actual_id,

                "predicted_id": predicted_id,

                "confidence": round(confidence, 4),

                "informative_probability": round(
                    informative_probability, 4
                ),

                "correct": correct,

                "error_type": (
                    "correct"
                    if correct
                    else (
                        "false_positive"
                        if predicted_id == 1
                        else "false_negative"
                    )
                )

            })

        except Exception as error:

            failed_images.append({

                "image_path": str(image_path),

                "error": str(error)

            })

        if (index + 1) % 100 == 0:

            print(
                f"Processed {index + 1}/"
                f"{len(california_data)} images"
            )

    # --------------------------------------
    # 4. CREATE RESULTS DATAFRAME
    # --------------------------------------

    results_df = pd.DataFrame(results)

    if results_df.empty:
        raise RuntimeError(
            "No images were successfully evaluated."
        )

    y_true = results_df["actual_id"]

    y_pred = results_df["predicted_id"]

    y_scores = results_df["informative_probability"]

    # --------------------------------------
    # 5. CALCULATE METRICS
    # --------------------------------------

    accuracy = accuracy_score(
        y_true,
        y_pred
    )

    macro_f1 = f1_score(
        y_true,
        y_pred,
        average="macro"
    )

    matrix = confusion_matrix(
        y_true,
        y_pred,
        labels=[0, 1]
    )

    report = classification_report(
        y_true,
        y_pred,
        labels=[0, 1],
        target_names=CLASS_NAMES,
        output_dict=True,
        zero_division=0
    )

    try:

        roc_auc = roc_auc_score(
            y_true,
            y_scores
        )

    except ValueError:

        roc_auc = None

    false_positives = results_df[
        results_df["error_type"] == "false_positive"
    ]

    false_negatives = results_df[
        results_df["error_type"] == "false_negative"
    ]

    correct_predictions = results_df[
        results_df["correct"]
    ]

    # --------------------------------------
    # 6. SAVE PREDICTIONS
    # --------------------------------------

    predictions_path = (
        OUTPUT_DIR
        / "california_wildfire_predictions.csv"
    )

    results_df.to_csv(
        predictions_path,
        index=False
    )

    # --------------------------------------
    # 7. SAVE ERROR EXAMPLES
    # --------------------------------------

    for error_type in [
        "false_positive",
        "false_negative"
    ]:

        error_folder = SAMPLE_DIR / error_type

        error_folder.mkdir(
            parents=True,
            exist_ok=True
        )

        error_data = results_df[
            results_df["error_type"] == error_type
        ].copy()

        # Save the most confident incorrect predictions first.
        error_data = error_data.sort_values(
            "confidence",
            ascending=False
        )

        for sample_index, (_, row) in enumerate(
            error_data.head(
                MAX_SAMPLES_PER_ERROR_TYPE
            ).iterrows()
        ):

            source = Path(row["image_path"])

            destination = (
                error_folder
                / f"{sample_index + 1}_{source.name}"
            )

            shutil.copy2(
                source,
                destination
            )

    # --------------------------------------
    # 8. SAVE METRICS
    # --------------------------------------

    metrics = {

        "event": EVENT_NAME,

        "split": SPLIT_NAME,

        "total_images": len(california_data),

        "successfully_evaluated": len(results_df),

        "failed_images": len(failed_images),

        "accuracy": round(
            float(accuracy), 4
        ),

        "macro_f1": round(
            float(macro_f1), 4
        ),

        "roc_auc": (
            round(float(roc_auc), 4)
            if roc_auc is not None
            else None
        ),

        "correct_predictions": len(
            correct_predictions
        ),

        "false_positives": len(
            false_positives
        ),

        "false_negatives": len(
            false_negatives
        ),

        "confusion_matrix": matrix.tolist(),

        "classification_report": report,

        "failed_image_details": failed_images,

        "label_warning": (
            "CrisisMMD informativeness annotations are associated "
            "with tweet informativeness. They are not independent "
            "image-only ground truth."
        )

    }

    metrics_path = (
        OUTPUT_DIR
        / "california_wildfire_metrics.json"
    )

    with open(
        metrics_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            metrics,
            file,
            indent=4
        )

    # --------------------------------------
    # 9. DISPLAY RESULTS
    # --------------------------------------

    print("\n" + "=" * 60)

    print("CALIFORNIA WILDFIRE RESULTS")

    print("=" * 60)

    print(f"Total images: {len(california_data)}")

    print(f"Evaluated: {len(results_df)}")

    print(f"Failed: {len(failed_images)}")

    print(f"Accuracy: {accuracy:.4f}")

    print(f"Macro F1: {macro_f1:.4f}")

    if roc_auc is not None:
        print(f"ROC-AUC: {roc_auc:.4f}")

    print("\nCONFUSION MATRIX")

    print(
        "Rows = Actual, Columns = Predicted"
    )

    print(
        "Labels: [not_informative, informative]"
    )

    print(matrix)

    print("\nCLASSIFICATION REPORT")

    print(
        classification_report(
            y_true,
            y_pred,
            labels=[0, 1],
            target_names=CLASS_NAMES,
            zero_division=0
        )
    )

    print("\nERROR ANALYSIS")

    print(
        f"False positives: {len(false_positives)}"
    )

    print(
        f"False negatives: {len(false_negatives)}"
    )

    print(
        f"Correct predictions: {len(correct_predictions)}"
    )

    print("\nFILES SAVED")

    print(predictions_path)

    print(metrics_path)

    print(SAMPLE_DIR)

    print("\nCalifornia wildfire analysis completed!")


# ==========================================
# EXECUTION
# ==========================================

if __name__ == "__main__":
    main()
