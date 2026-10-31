
import torch
from torchvision.models import (
    mobilenet_v3_small,
    MobileNet_V3_Small_Weights
)
from pathlib import Path

print("=" * 55)
print("SATYAMAP AI - MobileNetV3-Small Downloader")
print("=" * 55)

# Select device
device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("\nDevice:", device)

# Load official pretrained ImageNet weights
print("\nLoading pretrained MobileNetV3-Small...")

weights = MobileNet_V3_Small_Weights.DEFAULT

model = mobilenet_v3_small(weights=weights)

model.eval()

# Save weights in the models folder
save_path = Path(__file__).resolve().parent / "mobilenet_v3_small_pretrained.pth"

torch.save(model.state_dict(), save_path)

# Model information
parameters = sum(
    p.numel() for p in model.parameters()
)

print("\nDOWNLOAD SUCCESSFUL!")
print("Architecture: MobileNetV3-Small")
print("Pretrained on: ImageNet")
print("Parameters:", f"{parameters:,}")
print("Output classes:", model.classifier[-1].out_features)
print("Saved location:", save_path)
print("File size (MB):", round(save_path.stat().st_size / (1024 * 1024), 2))

print("\nSATYAMAP AI model download completed!")
