import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleOut, VehicleCreate, VehicleLocationUpdate

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleOut])
def list_vehicles(
    district_id: Optional[int] = None,
    status: Optional[str] = None,
    commodity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)
    if district_id:
        query = query.filter(Vehicle.assigned_district_id == district_id)
    if status:
        query = query.filter(Vehicle.status == status)
    if commodity_type:
        query = query.filter(Vehicle.commodity_type == commodity_type)
    
    return [VehicleOut.model_validate(v) for v in query.all()]

@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return VehicleOut.model_validate(veh)

@router.post("/{vehicle_id}/location", response_model=VehicleOut)
def update_vehicle_location(vehicle_id: int, loc: VehicleLocationUpdate, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    veh.current_lat = loc.current_lat
    veh.current_long = loc.current_long
    if loc.heading_deg is not None:
        veh.heading_deg = loc.heading_deg
    if loc.speed_kmh is not None:
        veh.speed_kmh = loc.speed_kmh
    if loc.status is not None:
        veh.status = loc.status
    if loc.eta_minutes is not None:
        veh.eta_minutes = loc.eta_minutes
    if loc.delay_reason is not None:
        veh.delay_reason = loc.delay_reason

    veh.last_update_time = datetime.utcnow()
    db.commit()
    db.refresh(veh)
    return VehicleOut.model_validate(veh)

@router.post("/simulate-step", response_model=List[VehicleOut])
def simulate_fleet_step(db: Session = Depends(get_db)):
    """
    Live demonstration endpoint: Advances moving vehicles along their route geometry,
    updating position, heading, and reducing ETA.
    """
    vehicles = db.query(Vehicle).filter(Vehicle.status == "Moving").all()
    updated = []

    for v in vehicles:
        if not v.route_geojson:
            continue
        try:
            pts = json.loads(v.route_geojson)
            if not pts or len(pts) < 2:
                continue

            current_idx = v.current_step_index or 0
            next_idx = (current_idx + 1) % len(pts)

            prev_pt = pts[current_idx]
            next_pt = pts[next_idx]

            v.current_lat = next_pt[0]
            v.current_long = next_pt[1]
            v.current_step_index = next_idx

            # Reduce ETA gradually
            v.eta_minutes = max(10, v.eta_minutes - 4)
            v.last_update_time = datetime.utcnow()
            updated.append(v)
        except Exception:
            continue

    if updated:
        db.commit()
        for u in updated:
            db.refresh(u)

    return [VehicleOut.model_validate(v) for v in db.query(Vehicle).all()]
