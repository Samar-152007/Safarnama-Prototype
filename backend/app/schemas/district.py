from typing import Optional
from pydantic import BaseModel

class DistrictBase(BaseModel):
    name: str
    state: str
    center_lat: float
    center_long: float
    polygon_geojson: Optional[str] = None
    risk_level: str = "Low"
    connectivity_score: float = 90.0

class DistrictCreate(DistrictBase):
    pass

class DistrictOut(DistrictBase):
    id: int
    open_incidents_count: Optional[int] = 0
    active_vehicles_count: Optional[int] = 0
    blocked_roads_count: Optional[int] = 0

    class Config:
        from_attributes = True
