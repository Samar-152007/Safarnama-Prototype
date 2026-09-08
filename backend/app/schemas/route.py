from typing import List, Optional, Any
from pydantic import BaseModel

class RouteSuggestRequest(BaseModel):
    origin_lat: float
    origin_long: float
    origin_name: Optional[str] = "Origin"
    dest_lat: float
    dest_long: float
    dest_name: Optional[str] = "Destination"
    vehicle_type: Optional[str] = "Standard Heavy Truck"
    cargo_sensitivity: Optional[str] = "High"  # 'High' for Medicines/Vaccines, 'Medium' for Food, 'Normal'

class RouteSegment(BaseModel):
    name: str
    code: str
    condition: str
    status: str
    risk_score: float
    distance_km: float
    slope_deg: float
    coordinates: List[List[float]]
    warning: Optional[str] = None

class RouteOption(BaseModel):
    route_name: str
    total_distance_km: float
    estimated_time_minutes: int
    overall_risk_score: float
    risk_category: str  # 'Low', 'Medium', 'High'
    blocked_segments_count: int
    path_coordinates: List[List[float]]
    segments: List[RouteSegment]
    ai_recommendation: str

class RouteSuggestResponse(BaseModel):
    origin: str
    destination: str
    vehicle_type: str
    primary_route: RouteOption
    alternate_route: Optional[RouteOption] = None
    weather_summary: str
    disruption_probability: float

class RiskSegmentQuery(BaseModel):
    district_id: Optional[int] = None
    min_risk: Optional[float] = 0.0

class RiskSegmentResponse(BaseModel):
    id: int
    name: str
    code: str
    risk_score: float
    risk_category: str
    rainfall_mm: float
    slope_deg: float
    condition: str
    status: str
    coordinates: List[List[float]]
