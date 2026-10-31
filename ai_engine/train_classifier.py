
import os
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models import mobilenet_v3_small

from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report,
    roc_auc_score
)


# ==================================================
# CONFIGURATION
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MANIFEST_PATH = (
    PROJECT_ROOT / "datasets" / "processed"
    / "crisismmd_manifest.csv"
)

PRETRAINED_PATH = (
    PROJECT_ROOT / "models"
    / "mobilenet_v3_small_pretrained.pth"
)

# MODEL_OUTPUT_PATH = (
#     PROJECT_ROOT / "models"
#     / "satyamap_mobilenetv3_small_best.pth"
# )

MODEL_OUTPUT_PATH = (
    PROJECT_ROOT
    / "models"
    / "satyamap_mobilenetv3_small_experiment.pth"
)

METRICS_PATH = (
    PROJECT_ROOT
    / "models"
    / "training_metrics_experiment.json"
)

HISTORY_PATH = (
    PROJECT_ROOT
    / "models"
    / "training_history_experiment.csv"
)


# METRICS_PATH = (
#     PROJECT_ROOT / "models"
#     / "training_metrics.json"
# )

# HISTORY_PATH = (
#     PROJECT_ROOT / "models"
#     / "training_history.csv"
# )

IMAGE_SIZE = 224
BATCH_SIZE = 32

# EPOCHS = 3
# LEARNING_RATE = 0.0001

EPOCHS = 5
LEARNING_RATE = 0.00003

NUM_WORKERS = 0

CLASS_NAMES = [
    "not_informative",
    "informative"
]

SEED = 42

DEVICE = torch.device("cpu")


# ==================================================
# REPRODUCIBILITY
# ==================================================

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

torch.set_num_threads(
    min(4, os.cpu_count() or 1)
)


# ==================================================
# IMAGE TRANSFORMS
# ==================================================

train_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.RandomHorizontalFlip(p=0.5),

    transforms.ColorJitter(
        brightness=0.1,
        contrast=0.1,
        saturation=0.1
    ),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


evaluation_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),

    transforms.ToTensor(),

    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ==================================================
# DATASET CLASS
# ==================================================

class CrisisImageDataset(Dataset):

    def __init__(self, dataframe, transform=None):

        self.dataframe = dataframe.reset_index(drop=True)
        self.transform = transform

    def __len__(self):

        return len(self.dataframe)

    def __getitem__(self, index):

        row = self.dataframe.iloc[index]

        image_path = row["image_path"]
        label = int(row["label"])

        try:
            with Image.open(image_path) as image:
                image = image.convert("RGB")

                if self.transform:
                    image = self.transform(image)

        except Exception as error:
            raise RuntimeError(
                f"Could not load image: {image_path}"
            ) from error

        return image, label


# ==================================================
# METRICS FUNCTION
# ==================================================

def calculate_metrics(actual, predicted, probabilities):

    accuracy = accuracy_score(
        actual,
        predicted
    )

    precision, recall, f1, _ = (
        precision_recall_fscore_support(
            actual,
            predicted,
            average="binary",
            pos_label=1,
            zero_division=0
        )
    )

    macro_f1 = precision_recall_fscore_support(
        actual,
        predicted,
        average="macro",
        zero_division=0
    )[2]

    matrix = confusion_matrix(
        actual,
        predicted,
        labels=[0, 1]
    )

    try:
        auc = roc_auc_score(
            actual,
            probabilities
        )
    except ValueError:
        auc = None

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "macro_f1": float(macro_f1),
        "roc_auc": float(auc) if auc is not None else None,
        "confusion_matrix": matrix.tolist()
    }


# ==================================================
# EVALUATION FUNCTION
# ==================================================

def evaluate_model(model, loader, criterion):

    model.eval()

    total_loss = 0.0
    actual = []
    predicted = []
    probabilities = []

    with torch.no_grad():

        for images, labels in loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)

            loss = criterion(outputs, labels)

            total_loss += loss.item() * images.size(0)

            probs = torch.softmax(outputs, dim=1)

            predictions = torch.argmax(
                outputs,
                dim=1
            )

            actual.extend(labels.cpu().numpy())
            predicted.extend(predictions.cpu().numpy())

            probabilities.extend(
                probs[:, 1].cpu().numpy()
            )

    metrics = calculate_metrics(
        actual,
        predicted,
        probabilities
    )

    metrics["loss"] = (
        total_loss / len(loader.dataset)
    )

    return metrics, actual, predicted


# ==================================================
# LOAD DATA
# ==================================================

def main():

    print("\nSATYAMAP AI MODEL TRAINING")
    print("=" * 60)

    if not MANIFEST_PATH.is_file():
        raise FileNotFoundError(MANIFEST_PATH)

    if not PRETRAINED_PATH.is_file():
        raise FileNotFoundError(PRETRAINED_PATH)

    MODEL_OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df = pd.read_csv(MANIFEST_PATH)

    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "validation"].copy()
    test_df = df[df["split"] == "test"].copy()

    print("\nDataset sizes:")
    print("Training:", len(train_df))
    print("Validation:", len(val_df))
    print("Testing:", len(test_df))

    # Verify labels
    for split_name, split_df in [
        ("train", train_df),
        ("validation", val_df),
        ("test", test_df)
    ]:

        if split_df.empty:
            raise ValueError(
                f"{split_name} dataset is empty"
            )

        if set(split_df["label"].unique()) != {0, 1}:
            raise ValueError(
                f"Both classes must exist in {split_name}"
            )

    # ==================================================
    # DATA LOADERS
    # ==================================================

    train_dataset = CrisisImageDataset(
        train_df,
        train_transform
    )

    val_dataset = CrisisImageDataset(
        val_df,
        evaluation_transform
    )

    test_dataset = CrisisImageDataset(
        test_df,
        evaluation_transform
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS
    )

    # ==================================================
    # LOAD PRETRAINED MODEL
    # ==================================================

    print("\nLoading MobileNetV3-Small...")

    checkpoint = torch.load(
        PRETRAINED_PATH,
        map_location="cpu",
        weights_only=True
    )

    if "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]

    elif "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]

    else:
        state_dict = checkpoint

    state_dict = {
        key.removeprefix("module."): value
        for key, value in state_dict.items()
    }

    model = mobilenet_v3_small(weights=None)

    model.load_state_dict(
        state_dict,
        strict=True
    )

    # Replace 1000-class ImageNet head with 2 classes
    input_features = model.classifier[3].in_features

    model.classifier[3] = nn.Linear(
        input_features,
        2
    )

    model = model.to(DEVICE)

    print("Pretrained weights loaded.")
    print("Output classes:", model.classifier[3].out_features)

    # ==================================================
    # CLASS WEIGHTS
    # ==================================================

    class_counts = (
        train_df["label"]
        .value_counts()
        .sort_index()
        .values
    )

    class_weights = (
        len(train_df) / (2.0 * class_counts)
    )

    class_weights = torch.tensor(
        class_weights,
        dtype=torch.float32
    ).to(DEVICE)

    print("\nClass weights:", class_weights.tolist())

    criterion = nn.CrossEntropyLoss(
        weight=class_weights
    )

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=LEARNING_RATE,
        weight_decay=0.01
    )

    # ==================================================
    # TRAINING LOOP
    # ==================================================

    best_macro_f1 = -1.0
    history = []

    print("\nStarting training...")
    print("=" * 60)

    for epoch in range(EPOCHS):

        model.train()

        running_loss = 0.0
        correct = 0
        total = 0

        for batch_index, (images, labels) in enumerate(
            train_loader
        ):

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad(set_to_none=True)

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            loss.backward()
            optimizer.step()

            running_loss += (
                loss.item() * images.size(0)
            )

            predictions = torch.argmax(
                outputs,
                dim=1
            )

            correct += (
                predictions == labels
            ).sum().item()

            total += labels.size(0)

            if (batch_index + 1) % 100 == 0:
                print(
                    f"Epoch {epoch + 1}/{EPOCHS} | "
                    f"Batch {batch_index + 1}/{len(train_loader)}"
                )

        train_loss = running_loss / total
        train_accuracy = correct / total

        # Validation
        val_metrics, _, _ = evaluate_model(
            model,
            val_loader,
            criterion
        )

        print("\n" + "-" * 50)

        print(f"Epoch: {epoch + 1}/{EPOCHS}")
        print(f"Training loss: {train_loss:.4f}")
        print(f"Training accuracy: {train_accuracy:.4f}")
        print(f"Validation loss: {val_metrics['loss']:.4f}")
        print(f"Validation accuracy: {val_metrics['accuracy']:.4f}")
        print(f"Validation macro F1: {val_metrics['macro_f1']:.4f}")

        history.append({
            "epoch": epoch + 1,
            "train_loss": train_loss,
            "train_accuracy": train_accuracy,
            "validation_loss": val_metrics["loss"],
            "validation_accuracy": val_metrics["accuracy"],
            "validation_macro_f1": val_metrics["macro_f1"]
        })

        # Save best model using validation macro F1
        if val_metrics["macro_f1"] > best_macro_f1:

            best_macro_f1 = val_metrics["macro_f1"]

            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "class_names": CLASS_NAMES,
                    "image_size": IMAGE_SIZE,
                    "architecture": "MobileNetV3-Small",
                    "best_validation_macro_f1": best_macro_f1
                },
                MODEL_OUTPUT_PATH
            )

            print("Best model checkpoint saved!")

    # Save training history
    pd.DataFrame(history).to_csv(
        HISTORY_PATH,
        index=False
    )

    # ==================================================
    # FINAL TEST EVALUATION
    # ==================================================

    print("\nLoading best model for final test...")

    best_checkpoint = torch.load(
        MODEL_OUTPUT_PATH,
        map_location=DEVICE,
        weights_only=True
    )

    model.load_state_dict(
        best_checkpoint["model_state_dict"]
    )

    test_metrics, actual, predicted = evaluate_model(
        model,
        test_loader,
        criterion
    )

    print("\n" + "=" * 60)
    print("FINAL TEST RESULTS")
    print("=" * 60)

    for key, value in test_metrics.items():
        print(f"{key}: {value}")

    print("\nClassification report:")

    print(
        classification_report(
            actual,
            predicted,
            labels=[0, 1],
            target_names=CLASS_NAMES,
            zero_division=0
        )
    )

    # Save metrics
    final_results = {
        "architecture": "MobileNetV3-Small",
        "training_epochs": len(history),
        "training_images": len(train_df),
        "validation_images": len(val_df),
        "test_images": len(test_df),
        "best_validation_macro_f1": best_macro_f1,
        "test_metrics": test_metrics
    }

    with open(
        METRICS_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            final_results,
            file,
            indent=4
        )

    print("\nTRAINING COMPLETE")
    print("Model saved:", MODEL_OUTPUT_PATH)
    print("Metrics saved:", METRICS_PATH)
    print("History saved:", HISTORY_PATH)


if __name__ == "__main__":
    main()
