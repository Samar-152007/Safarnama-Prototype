from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AlertBase(BaseModel):
    title: str
    description: str
    severity: str = "High"  # 'Low', 'Medium', 'High', 'Critical'
    district_id: Optional[int] = None
    related_road_id: Optional[int] = None
    related_vehicle_id: Optional[int] = None
    type: str  # 'BlockedRoad', 'HighRiskCorridor', 'DelayedDelivery', 'WeatherWarning'

class AlertCreate(AlertBase):
    pass

class AlertOut(AlertBase):
    id: int
    is_resolved: bool
    created_at: datetime
    district_name: Optional[str] = None
    road_name: Optional[str] = None
    vehicle_number: Optional[str] = None

    class Config:
        from_attributes = True
