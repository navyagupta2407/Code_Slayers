
from pathlib import Path

from ai_engine.duplicate_detector import find_duplicates
from ai_engine.historical_matcher import check_historical_image
from ai_engine.predict import predict_image
from ai_engine.location_extractor import extract_location_metadata


def analyze_evidence(
    image_path,
    existing_images=None,
    claimed_location=None,
    database_path=None
):
    """
    Run all SATYAMAP AI analysis modules on one image.

    Combines:
    1. Perceptual-hash duplicate detection
    2. Historical image matching
    3. MobileNetV3-Small informativeness prediction
    4. Location and EXIF metadata extraction

    Returns a JSON-compatible dictionary.

    IMPORTANT:
    The classifier predicts image informativeness.
    It does not verify image authenticity, disaster type,
    incident occurrence, location, or date.
    """

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    if existing_images is None:
        existing_images = {}

    # ------------------------------------------
    # 1. DUPLICATE DETECTION
    # ------------------------------------------

    duplicate_result = find_duplicates(
        image_path,
        existing_images
    )

    # ------------------------------------------
    # 2. HISTORICAL IMAGE MATCHING
    # ------------------------------------------

    if database_path is None:
        historical_result = check_historical_image(
            image_path
        )
    else:
        historical_result = check_historical_image(
            image_path,
            database_path
        )

    # ------------------------------------------
    # 3. MOBILENETV3 IMAGE INFORMATIVENESS
    # ------------------------------------------

    classification_result = predict_image(
        image_path
    )

    # ------------------------------------------
    # 4. LOCATION AND EXIF EXTRACTION
    # ------------------------------------------

    location_result = extract_location_metadata(
        image_path,
        claimed_location=claimed_location
    )

    # ------------------------------------------
    # 5. EVIDENCE FUSION
    # ------------------------------------------

    duplicate_detected = bool(
        duplicate_result.get("duplicate_detected", False)
    )

    historical_match = bool(
        historical_result.get("historical_match", False)
    )

    # This is a baseline model. Its output must be
    # reviewed by a human and must not be treated as
    # proof that a report is genuine or false.
    classification_review = True

    requires_human_review = bool(
        duplicate_detected
        or historical_match
        or classification_review
    )

    # ------------------------------------------
    # 6. FINAL RESULT
    # ------------------------------------------

    return {
        "image_path": str(image_path),

        "analysis_status": "completed",

        "duplicate_detection": duplicate_result,

        "historical_analysis": historical_result,

        "image_informativeness": classification_result,

        "location_analysis": location_result,

        "evidence_summary": {
            "predicted_informativeness": (
                classification_result.get("predicted_class")
            ),

            "classification_score": (
                classification_result.get("confidence")
            ),

            "classification_model": (
                classification_result.get("model")
            ),

            "duplicate_detected": duplicate_detected,

            "historical_match_found": historical_match,

            "gps_metadata_available": bool(
                location_result.get("gps_metadata_available", False)
            ),

            "claimed_location": location_result.get(
                "claimed_location"
            ),

            "requires_human_review": requires_human_review,

            "requires_location_verification": True,

            "verification_warning": (
                "AI predictions are preliminary evidence only. "
                "Image informativeness does not establish authenticity, "
                "disaster type, incident occurrence, location, or date."
            )
        }
    }
