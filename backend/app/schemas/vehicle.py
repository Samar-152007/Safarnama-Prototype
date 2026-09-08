from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class VehicleBase(BaseModel):
    vehicle_number: str
    driver_name: str
    driver_phone: Optional[str] = None
    commodity_type: str = "Medicines"
    current_lat: float
    current_long: float
    heading_deg: float = 0.0
    speed_kmh: float = 45.0
    origin_name: str
    dest_name: str
    origin_lat: Optional[float] = None
    origin_long: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_long: Optional[float] = None
    route_geojson: Optional[str] = None
    current_step_index: int = 0
    status: str = "Moving"
    eta_minutes: int = 120
    delay_reason: Optional[str] = None
    assigned_district_id: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleLocationUpdate(BaseModel):
    current_lat: float
    current_long: float
    heading_deg: Optional[float] = None
    speed_kmh: Optional[float] = None
    status: Optional[str] = None
    eta_minutes: Optional[int] = None
    delay_reason: Optional[str] = None

class VehicleOut(VehicleBase):
    id: int
    last_update_time: datetime

    class Config:
        from_attributes = True
