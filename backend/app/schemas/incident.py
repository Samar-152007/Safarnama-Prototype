from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class IncidentBase(BaseModel):
    type: str  # 'Landslide', 'Flood', 'Road Damage', 'Bridge Blocked', 'Traffic Congestion', 'Other'
    description: str
    severity: str = "Medium"  # 'Low', 'Medium', 'High'
    lat: float
    long: float
    road_name: Optional[str] = None
    district_id: Optional[int] = None
    photo_url: Optional[str] = None
    reporter_name: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    status: Optional[str] = None  # 'Open', 'In Progress', 'Resolved'
    severity: Optional[str] = None
    officer_notes: Optional[str] = None
    description: Optional[str] = None

class IncidentOut(IncidentBase):
    id: int
    status: str
    reported_by_user_id: Optional[int] = None
    officer_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
