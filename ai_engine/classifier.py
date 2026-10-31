
from pathlib import Path

from PIL import Image, UnidentifiedImageError
from transformers import pipeline


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

MODEL_NAME = "openai/clip-vit-base-patch32"

# Minimum score required to accept a prediction.
MIN_CONFIDENCE = 0.30

# Minimum difference between the top two scores.
MIN_SCORE_MARGIN = 0.05

DISASTER_LABELS = [
    "a photograph of a flood with submerged roads and buildings",
    "a photograph of a wildfire with flames and burning vegetation",
    "a photograph of earthquake damage with collapsed buildings and rubble",
    "a photograph of a landslide with mud and soil covering an area",
    "a photograph of cyclone or storm damage with destroyed structures",
    "a normal photograph with no visible disaster"
]

LABEL_TO_CATEGORY = {
    DISASTER_LABELS[0]: "flood",
    DISASTER_LABELS[1]: "wildfire",
    DISASTER_LABELS[2]: "earthquake",
    DISASTER_LABELS[3]: "landslide",
    DISASTER_LABELS[4]: "cyclone_or_storm",
    DISASTER_LABELS[5]: "normal"
}


# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

_classifier = None


def load_classifier():
    """
    Load the CLIP model once and reuse it.
    """

    global _classifier

    if _classifier is None:
        print("Loading SATYAMAP AI image classifier...")

        _classifier = pipeline(
            task="zero-shot-image-classification",
            model=MODEL_NAME,
            device=-1
        )

        print("Image classifier loaded successfully!")

    return _classifier


# --------------------------------------------------
# CLASSIFY IMAGE
# --------------------------------------------------

def classify_disaster_image(image_path):
    """
    Classify an image into a possible disaster category.

    Returns the predicted category, model score,
    alternative predictions and human-review status.
    """

    image_path = Path(image_path)

    # Check whether the image exists.
    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    # Open and validate the image.
    try:
        with Image.open(image_path) as image:
            image = image.convert("RGB")

    except (UnidentifiedImageError, OSError) as error:
        raise ValueError(
            f"Cannot process image: {image_path}"
        ) from error

    # Load the model.
    model = load_classifier()

    # Perform zero-shot classification.
    predictions = model(
        image,
        candidate_labels=DISASTER_LABELS
    )

    # Sort predictions by score.
    predictions = sorted(
        predictions,
        key=lambda item: item["score"],
        reverse=True
    )

    # Get the highest-scoring prediction.
    best_prediction = predictions[0]

    predicted_label = best_prediction["label"]
    predicted_category = LABEL_TO_CATEGORY[predicted_label]
    confidence = float(best_prediction["score"])

    # Calculate the difference between the top two scores.
    second_score = (
        float(predictions[1]["score"])
        if len(predictions) > 1
        else 0.0
    )

    score_margin = confidence - second_score

    # Flag uncertain predictions for human review.
    requires_human_review = (
        confidence < MIN_CONFIDENCE
        or score_margin < MIN_SCORE_MARGIN
        or predicted_category == "normal"
    )

    # Prepare alternative predictions.
    top_candidates = []

    for prediction in predictions[:3]:
        top_candidates.append({
            "category": LABEL_TO_CATEGORY[prediction["label"]],
            "score": float(prediction["score"])
        })

    return {
        "image_path": str(image_path),
        "disaster_type": predicted_category,
        "confidence": confidence,
        "score_margin": float(score_margin),
        "top_candidates": top_candidates,
        "requires_human_review": bool(requires_human_review),
        "model": MODEL_NAME
    }
