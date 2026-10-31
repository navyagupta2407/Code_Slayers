
from pathlib import Path

from PIL import Image, UnidentifiedImageError
import imagehash


DUPLICATE_THRESHOLD = 6


def calculate_hash(image_path):
    """
    Generate a perceptual hash (pHash) for an image.
    """

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    try:
        with Image.open(image_path) as image:
            image_hash = imagehash.phash(
                image.convert("RGB")
            )

        return image_hash

    except (UnidentifiedImageError, OSError) as error:
        raise ValueError(
            f"Cannot process image: {image_path}"
        ) from error


def compare_images(image_path_1, image_path_2):
    """
    Compare two image files using pHash distance.
    """

    hash_1 = calculate_hash(image_path_1)
    hash_2 = calculate_hash(image_path_2)

    distance = hash_1 - hash_2

    return {
        "distance": int(distance),
        "is_duplicate": bool(
            distance <= DUPLICATE_THRESHOLD
        ),
        "threshold": DUPLICATE_THRESHOLD
    }


def find_duplicates(new_image_path, existing_images):
    """
    Compare a new image against existing image records.

    Supports both:
    1. Image file paths
    2. Previously calculated pHash strings

    Example:
    {
        "RPT_001": "path/to/image.jpg",
        "RPT_002": "ccaf59d68b00a57a"
    }
    """

    new_hash = calculate_hash(new_image_path)

    matches = []

    for report_id, existing_value in existing_images.items():

        try:
            # If the value is a valid file path, calculate its hash.
            existing_path = Path(existing_value)

            if existing_path.is_file():
                existing_hash = calculate_hash(existing_path)

            else:
                # Otherwise, interpret it as a stored pHash.
                existing_hash = imagehash.hex_to_hash(
                    str(existing_value)
                )

            distance = new_hash - existing_hash

            if distance <= DUPLICATE_THRESHOLD:
                matches.append({
                    "report_id": report_id,
                    "distance": int(distance)
                })

        except (ValueError, OSError, TypeError):
            # Skip malformed registry entries.
            continue

    matches.sort(
        key=lambda match: match["distance"]
    )

    return {
        "duplicate_detected": len(matches) > 0,
        "matches": matches,
        "threshold": DUPLICATE_THRESHOLD
    }
