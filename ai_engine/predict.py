
from pathlib import Path

import torch
import torch.nn as nn

from PIL import Image
from torchvision import transforms
from torchvision.models import mobilenet_v3_small


# ==================================================
# CONFIGURATION
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "satyamap_mobilenetv3_small_best.pth"
)

IMAGE_SIZE = 224

CLASS_NAMES = [
    "not_informative",
    "informative"
]

DEVICE = torch.device("cpu")


# ==================================================
# IMAGE TRANSFORMATION
# ==================================================

transform = transforms.Compose([

    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )

])


# ==================================================
# MODEL LOADER
# ==================================================

def load_model():

    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model checkpoint not found: {MODEL_PATH}"
        )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=True
    )

    model = mobilenet_v3_small(weights=None)

    input_features = model.classifier[3].in_features

    model.classifier[3] = nn.Linear(
        input_features,
        len(CLASS_NAMES)
    )

    model.load_state_dict(
        checkpoint["model_state_dict"],
        strict=True
    )

    model.to(DEVICE)
    model.eval()

    return model


# ==================================================
# PREDICTION FUNCTION
# ==================================================

def predict_image(image_path, model=None):

    image_path = Path(image_path)

    if not image_path.is_file():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    if model is None:
        model = load_model()

    try:
        with Image.open(image_path) as image:
            image = image.convert("RGB")
            image_tensor = transform(image).unsqueeze(0)

    except Exception as error:
        raise ValueError(
            f"Could not process image: {error}"
        ) from error

    image_tensor = image_tensor.to(DEVICE)

    with torch.no_grad():

        outputs = model(image_tensor)

        probabilities = torch.softmax(
            outputs,
            dim=1
        )[0]

        predicted_index = int(
            torch.argmax(probabilities).item()
        )

    result = {
        "predicted_class": CLASS_NAMES[predicted_index],

        "class_id": predicted_index,

        "confidence": round(
            float(probabilities[predicted_index].item()),
            4
        ),

        "probabilities": {
            CLASS_NAMES[i]: round(
                float(probabilities[i].item()),
                4
            )
            for i in range(len(CLASS_NAMES))
        },

        "model": "MobileNetV3-Small",

        "interpretation": (
            "Image appears informative for disaster response."
            if predicted_index == 1
            else
            "Image appears not informative for disaster response."
        ),

        "warning": (
            "This is an image-only informativeness prediction. "
            "It does not establish image authenticity, disaster "
            "location, date, or whether an incident occurred."
        )
    }

    return result


# ==================================================
# TESTING
# ==================================================

if __name__ == "__main__":

    print("\nSATYAMAP AI IMAGE PREDICTION")
    print("=" * 55)

    model = load_model()

    print("Model loaded successfully!")

    # Test using an image from the processed dataset
    import pandas as pd

    manifest_path = (
        PROJECT_ROOT
        / "datasets"
        / "processed"
        / "crisismmd_manifest.csv"
    )

    dataframe = pd.read_csv(manifest_path)

    sample = dataframe.sample(
        n=1,
        random_state=42
    ).iloc[0]

    image_path = sample["image_path"]

    print("\nTesting image:")
    print(image_path)

    result = predict_image(
        image_path,
        model
    )

    print("\nPREDICTION RESULT")
    print("=" * 55)

    for key, value in result.items():
        print(f"{key}: {value}")

    print("\nActual dataset label:")
    print(sample["original_label"])

    print("\nPrediction test completed!")
