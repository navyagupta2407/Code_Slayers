from io import BytesIO
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException

MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_FORMATS = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp"
}

def validate_image(file_bytes: bytes):
    if not file_bytes:
        raise HTTPException(400, "Empty image file")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(413, "Image exceeds 10 MB limit")

    try:
        image = Image.open(BytesIO(file_bytes))

        if image.format not in ALLOWED_FORMATS:
            raise HTTPException(400, "Only JPEG, PNG and WebP images are allowed")

        if image.width * image.height > 40_000_000:
            raise HTTPException(400, "Image dimensions are too large")

        image.verify()

        return ALLOWED_FORMATS[image.format]

    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(400, "Invalid or corrupted image")
