from typing import Optional
from pydantic import BaseModel

class RoadBase(BaseModel):
    name: str
    code: str
    district_id: Optional[int] = None
    start_lat: float
    start_long: float
    start_name: Optional[str] = None
    end_lat: float
    end_long: float
    end_name: Optional[str] = None
    coordinates_geojson: str
    length_km: float = 10.0
    condition: str = "Good"
    status: str = "Open"
    risk_score: float = 0.15
    slope_deg: float = 12.0
    avg_rainfall_mm: float = 25.0
    historical_incidents: int = 1
    bridge_present: bool = False
    bridge_name: Optional[str] = None
    is_emergency_corridor: bool = False

class RoadCreate(RoadBase):
    pass

class RoadUpdate(BaseModel):
    condition: Optional[str] = None
    status: Optional[str] = None
    risk_score: Optional[float] = None
    avg_rainfall_mm: Optional[float] = None

class RoadOut(RoadBase):
    id: int

    class Config:
        from_attributes = True
