
import json
import logging
from pathlib import Path

from ai_engine.duplicate_detector import (
    calculate_hash,
    DUPLICATE_THRESHOLD
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]

DEFAULT_DATABASE = (
    PROJECT_ROOT / "data" / "historical_images.json"
)

logger = logging.getLogger(__name__)


def load_historical_database(database_path=DEFAULT_DATABASE):
    """
    Load historical image reference records.
    """

    database_path = Path(database_path)

    if not database_path.is_file():
        logger.warning(
            "Historical database not found: %s",
            database_path
        )
        return []

    try:
        with open(database_path, "r", encoding="utf-8") as file:
            records = json.load(file)

    except (json.JSONDecodeError, OSError) as error:
        raise ValueError(
            "Could not read historical image database."
        ) from error

    if not isinstance(records, list):
        raise ValueError(
            "Historical database must contain a JSON list."
        )

    return records


def check_historical_image(
    new_image_path,
    database_path=DEFAULT_DATABASE
):
    """
    Compare an uploaded image against historical references.

    Synthetic references are identified explicitly and
    must not be treated as verified historical evidence.
    """

    historical_records = load_historical_database(database_path)

    new_hash = calculate_hash(new_image_path)

    matches = []
    skipped_records = 0

    for record in historical_records:

        try:
            reference_id = record["reference_id"]
            reference_relative_path = record["image_path"]

            reference_path = (
                PROJECT_ROOT / reference_relative_path
            )

            if not reference_path.is_file():
                logger.warning(
                    "Historical reference image missing: %s",
                    reference_path
                )
                skipped_records += 1
                continue

            reference_hash = calculate_hash(reference_path)

            distance = new_hash - reference_hash

            if distance <= DUPLICATE_THRESHOLD:

                source = record.get("source", "unknown")

                # Synthetic records are not verified evidence.
                is_synthetic = (
                    "synthetic" in str(source).lower()
                )

                matches.append({
                    "reference_id": reference_id,
                    "event_name": record.get("event_name"),
                    "event_date": record.get("event_date"),
                    "location": record.get("location"),
                    "source": source,
                    "reference_type": (
                        "synthetic_test"
                        if is_synthetic
                        else "historical_reference_unverified"
                    ),
                    "verified_historical_evidence": False,
                    "hash_distance": int(distance)
                })

        except (KeyError, TypeError, ValueError, OSError) as error:
            logger.warning(
                "Skipping invalid historical record: %s",
                error
            )
            skipped_records += 1

    matches.sort(
        key=lambda match: match["hash_distance"]
    )

    return {
        "historical_match": len(matches) > 0,
        "historical_matches": matches,
        "requires_human_review": len(matches) > 0,
        "reference_count": len(historical_records),
        "skipped_records": skipped_records,
        "threshold": DUPLICATE_THRESHOLD,
        "warning": (
            "A perceptual hash match indicates visual similarity only. "
            "It does not establish the image's capture date, location, "
            "authenticity, or historical origin."
        )
    }
