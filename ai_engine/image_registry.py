import json
from pathlib import Path

from ai_engine.duplicate_detector import calculate_hash


PROJECT_ROOT = Path(__file__).resolve().parent.parent

REGISTRY_PATH = PROJECT_ROOT / "data" / "image_registry.json"


def load_image_registry():
    """
    Load previously registered image hashes.
    """

    REGISTRY_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    if not REGISTRY_PATH.exists():
        return {}

    try:
        with open(REGISTRY_PATH, "r", encoding="utf-8") as file:
            return json.load(file)

    except (json.JSONDecodeError, OSError):
        raise RuntimeError(
            "Image registry could not be read."
        )


def save_image_registry(registry):
    """
    Save image hashes to persistent JSON storage.
    """

    REGISTRY_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    temporary_path = REGISTRY_PATH.with_suffix(".tmp")

    with open(temporary_path, "w", encoding="utf-8") as file:
        json.dump(
            registry,
            file,
            indent=4
        )

    temporary_path.replace(REGISTRY_PATH)


def register_image(image_path, filename):
    """
    Register an image after its analysis.

    Returns its perceptual hash.
    """

    image_hash = str(calculate_hash(image_path))

    registry = load_image_registry()

    registry[filename] = image_hash

    save_image_registry(registry)

    return image_hash