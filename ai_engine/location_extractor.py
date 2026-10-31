
from pathlib import Path
import exifread


def _ratio_to_float(value):
    """
    Convert an EXIF rational value into a float.
    """

    if hasattr(value, "num") and hasattr(value, "den"):
        if value.den == 0:
            raise ValueError("Invalid EXIF rational value")
        return float(value.num) / float(value.den)

    return float(value)


def _convert_gps_to_decimal(coordinates, direction):
    """
    Convert GPS degrees, minutes and seconds into decimal coordinates.
    """

    if len(coordinates) != 3:
        raise ValueError("GPS coordinates must contain three values")

    degrees = _ratio_to_float(coordinates[0])
    minutes = _ratio_to_float(coordinates[1])
    seconds = _ratio_to_float(coordinates[2])

    decimal = degrees + (minutes / 60) + (seconds / 3600)

    if direction in ("S", "W"):
        decimal = -decimal
    elif direction not in ("N", "E"):
        raise ValueError("Invalid GPS direction")

    return decimal


def extract_location_metadata(image_path, claimed_location=None):
    """
    Extract GPS coordinates, capture time and camera information.

    A citizen-provided location claim is kept separate from GPS metadata.
    """

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    try:
        with image_path.open("rb") as image_file:
            tags = exifread.process_file(
                image_file,
                details=False
            )

    except OSError as error:
        raise ValueError(
            f"Unable to read image metadata: {image_path}"
        ) from error

    # ------------------------------------------
    # CAMERA INFORMATION
    # ------------------------------------------

    camera_make = str(tags.get("Image Make", "")) or None
    camera_model = str(tags.get("Image Model", "")) or None

    # ------------------------------------------
    # IMAGE CAPTURE DATE
    # ------------------------------------------

    capture_time = (
        tags.get("EXIF DateTimeOriginal")
        or tags.get("EXIF DateTimeDigitized")
        or tags.get("Image DateTime")
    )

    capture_time = str(capture_time) if capture_time else None

    # ------------------------------------------
    # GPS INFORMATION
    # ------------------------------------------

    latitude = None
    longitude = None
    gps_available = False

    gps_latitude = tags.get("GPS GPSLatitude")
    gps_latitude_ref = tags.get("GPS GPSLatitudeRef")

    gps_longitude = tags.get("GPS GPSLongitude")
    gps_longitude_ref = tags.get("GPS GPSLongitudeRef")

    if all([
        gps_latitude,
        gps_latitude_ref,
        gps_longitude,
        gps_longitude_ref
    ]):
        try:
            latitude = _convert_gps_to_decimal(
                gps_latitude.values,
                str(gps_latitude_ref)
            )

            longitude = _convert_gps_to_decimal(
                gps_longitude.values,
                str(gps_longitude_ref)
            )

            if not (-90 <= latitude <= 90):
                raise ValueError("Latitude out of range")

            if not (-180 <= longitude <= 180):
                raise ValueError("Longitude out of range")

            gps_available = True

        except (ValueError, TypeError, ZeroDivisionError):
            latitude = None
            longitude = None
            gps_available = False

    # ------------------------------------------
    # FINAL STRUCTURED RESULT
    # ------------------------------------------

    return {
        "image_path": str(image_path),
        "gps_metadata_available": gps_available,
        "gps_coordinates": {
            "latitude": latitude,
            "longitude": longitude
        } if gps_available else None,
        "capture_time": capture_time,
        "camera": {
            "make": camera_make,
            "model": camera_model
        },
        "claimed_location": claimed_location,
        "location_sources": {
            "gps": "image_exif" if gps_available else None,
            "claimed_location": (
                "user_provided" if claimed_location else None
            )
        },
        "requires_location_verification": True
    }
