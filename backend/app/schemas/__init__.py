from app.schemas.user import UserBase, UserCreate, UserUpdate, UserOut, LoginRequest, TokenResponse
from app.schemas.district import DistrictBase, DistrictCreate, DistrictOut
from app.schemas.road import RoadBase, RoadCreate, RoadUpdate, RoadOut
from app.schemas.vehicle import VehicleBase, VehicleCreate, VehicleLocationUpdate, VehicleOut
from app.schemas.incident import IncidentBase, IncidentCreate, IncidentUpdate, IncidentOut
from app.schemas.alert import AlertBase, AlertCreate, AlertOut
from app.schemas.route import RouteSuggestRequest, RouteSuggestResponse, RouteOption, RouteSegment, RiskSegmentResponse

__all__ = [
    "UserBase", "UserCreate", "UserUpdate", "UserOut", "LoginRequest", "TokenResponse",
    "DistrictBase", "DistrictCreate", "DistrictOut",
    "RoadBase", "RoadCreate", "RoadUpdate", "RoadOut",
    "VehicleBase", "VehicleCreate", "VehicleLocationUpdate", "VehicleOut",
    "IncidentBase", "IncidentCreate", "IncidentUpdate", "IncidentOut",
    "AlertBase", "AlertCreate", "AlertOut",
    "RouteSuggestRequest", "RouteSuggestResponse", "RouteOption", "RouteSegment", "RiskSegmentResponse"
]
