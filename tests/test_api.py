
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from api.main import app
from api import main as api_main


client = TestClient(app)


def create_test_image():
    """Create a valid in-memory PNG image."""

    image = Image.new("RGB", (100, 100), color="blue")

    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")

    image_bytes.seek(0)

    return image_bytes


def mock_analysis_result(image_path, existing_images=None,
                         claimed_location=None):

    """Return a predictable AI analysis response."""

    return {
        "image_path": str(image_path),
        "analysis_status": "completed",

        "duplicate_detection": {
            "duplicate_detected": False,
            "matches": [],
            "threshold": 6
        },

        "historical_analysis": {
            "historical_match": False,
            "historical_matches": [],
            "requires_human_review": False
        },

        "image_informativeness": {
            "predicted_class": "informative",
            "class_id": 1,
            "confidence": 0.95,
            "model": "MobileNetV3-Small"
        },

        "location_analysis": {
            "image_path": str(image_path),
            "gps_metadata_available": False,
            "claimed_location": claimed_location
        },

        "evidence_summary": {
            "predicted_informativeness": "informative",
            "requires_human_review": True
        }
    }


# ------------------------------------------
# HEALTH CHECK
# ------------------------------------------

def test_health_endpoint():

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# ------------------------------------------
# HOME ENDPOINT
# ------------------------------------------

def test_home_endpoint():

    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["project"] == "SATYAMAP AI"


# ------------------------------------------
# SUCCESSFUL IMAGE ANALYSIS
# ------------------------------------------

def test_successful_image_analysis(monkeypatch):

    monkeypatch.setattr(
        api_main,
        "analyze_evidence",
        mock_analysis_result
    )

    monkeypatch.setattr(
        api_main,
        "load_image_registry",
        lambda: {}
    )

    monkeypatch.setattr(
        api_main,
        "register_image",
        lambda image_path, submission_id: "test-hash"
    )

    image = create_test_image()

    response = client.post(
        "/analyze",
        files={
            "file": (
                "test.png",
                image,
                "image/png"
            )
        },
        data={
            "claimed_location": "Ludhiana, Punjab, India"
        }
    )

    assert response.status_code == 200

    result = response.json()

    assert result["analysis_status"] == "completed"

    assert (
        result["image_informativeness"]["predicted_class"]
        == "informative"
    )

    assert "submission_id" in result


# ------------------------------------------
# INVALID FILE FORMAT
# ------------------------------------------

def test_invalid_file_format():

    response = client.post(
        "/analyze",
        files={
            "file": (
                "document.pdf",
                b"not an image",
                "application/pdf"
            )
        }
    )

    assert response.status_code == 400


# ------------------------------------------
# EMPTY FILE
# ------------------------------------------

def test_empty_file():

    response = client.post(
        "/analyze",
        files={
            "file": (
                "empty.png",
                b"",
                "image/png"
            )
        }
    )

    assert response.status_code == 400


# ------------------------------------------
# INVALID IMAGE CONTENT
# ------------------------------------------

def test_invalid_image_content():

    response = client.post(
        "/analyze",
        files={
            "file": (
                "fake.png",
                b"this is not a real image",
                "image/png"
            )
        }
    )

    assert response.status_code == 400


# ------------------------------------------
# OVERSIZED IMAGE
# ------------------------------------------

def test_oversized_upload():

    oversized_content = b"x" * (
        api_main.MAX_UPLOAD_SIZE + 1
    )

    response = client.post(
        "/analyze",
        files={
            "file": (
                "large.png",
                oversized_content,
                "image/png"
            )
        }
    )

    assert response.status_code == 413
