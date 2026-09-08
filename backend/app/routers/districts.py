from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.district import District
from app.models.incident import Incident
from app.models.vehicle import Vehicle
from app.models.road import Road
from app.schemas.district import DistrictOut

router = APIRouter(prefix="/districts", tags=["Districts"])

@router.get("", response_model=List[DistrictOut])
def list_districts(db: Session = Depends(get_db)):
    districts = db.query(District).all()
    out = []
    for d in districts:
        open_incidents = db.query(Incident).filter(Incident.district_id == d.id, Incident.status != "Resolved").count()
        active_veh = db.query(Vehicle).filter(Vehicle.assigned_district_id == d.id).count()
        blocked_roads = db.query(Road).filter(Road.district_id == d.id, Road.status == "Closed").count()

        d_out = DistrictOut(
            id=d.id,
            name=d.name,
            state=d.state,
            center_lat=d.center_lat,
            center_long=d.center_long,
            polygon_geojson=d.polygon_geojson,
            risk_level=d.risk_level,
            connectivity_score=d.connectivity_score,
            open_incidents_count=open_incidents,
            active_vehicles_count=active_veh,
            blocked_roads_count=blocked_roads
        )
        out.append(d_out)
    return out

@router.get("/{district_id}", response_model=DistrictOut)
def get_district(district_id: int, db: Session = Depends(get_db)):
    d = db.query(District).filter(District.id == district_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="District not found")
    
    open_incidents = db.query(Incident).filter(Incident.district_id == d.id, Incident.status != "Resolved").count()
    active_veh = db.query(Vehicle).filter(Vehicle.assigned_district_id == d.id).count()
    blocked_roads = db.query(Road).filter(Road.district_id == d.id, Road.status == "Closed").count()

    return DistrictOut(
        id=d.id,
        name=d.name,
        state=d.state,
        center_lat=d.center_lat,
        center_long=d.center_long,
        polygon_geojson=d.polygon_geojson,
        risk_level=d.risk_level,
        connectivity_score=d.connectivity_score,
        open_incidents_count=open_incidents,
        active_vehicles_count=active_veh,
        blocked_roads_count=blocked_roads
    )
