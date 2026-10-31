
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    description: str = Field(min_length=10, max_length=3000)
    incident_type: Literal[
        "flood", "storm", "landslide", "heatwave", "other"
    ]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    claimed_at: Optional[datetime] = None

    title: Optional[str] = Field(default=None, max_length=200)
    location: Optional[str] = Field(default=None, max_length=500)
    severity: Optional[str] = Field(default="moderate", max_length=50)


class ModerationDecision(BaseModel):
    verification_status: Literal["verified", "misleading"]
    review_note: Optional[str] = Field(default=None, max_length=1000)
