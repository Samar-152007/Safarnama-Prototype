from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.road import Road
from app.schemas.road import RoadOut, RoadUpdate, RoadCreate
from app.ai.risk_model import risk_model

router = APIRouter(prefix="/roads", tags=["Roads"])

@router.get("", response_model=List[RoadOut])
def list_roads(
    district_id: Optional[int] = None,
    status: Optional[str] = None,
    condition: Optional[str] = None,
    min_risk: Optional[float] = Query(None, ge=0.0, le=1.0),
    is_emergency: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Road)
    if district_id:
        query = query.filter(Road.district_id == district_id)
    if status:
        query = query.filter(Road.status == status)
    if condition:
        query = query.filter(Road.condition == condition)
    if min_risk is not None:
        query = query.filter(Road.risk_score >= min_risk)
    if is_emergency is not None:
        query = query.filter(Road.is_emergency_corridor == is_emergency)

    return [RoadOut.model_validate(r) for r in query.all()]

@router.get("/{road_id}", response_model=RoadOut)
def get_road(road_id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road segment not found")
    return RoadOut.model_validate(road)

@router.put("/{road_id}", response_model=RoadOut)
def update_road(road_id: int, road_in: RoadUpdate, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road segment not found")

    if road_in.status is not None:
        road.status = road_in.status
    if road_in.condition is not None:
        road.condition = road_in.condition
    if road_in.avg_rainfall_mm is not None:
        road.avg_rainfall_mm = road_in.avg_rainfall_mm

    # Re-evaluate AI risk score based on updated conditions
    if road_in.risk_score is not None:
        road.risk_score = road_in.risk_score
    else:
        new_risk = risk_model.predict_risk(
            rainfall_mm=road.avg_rainfall_mm,
            slope_deg=road.slope_deg,
            condition=road.condition,
            historical_incidents=road.historical_incidents,
            bridge_present=road.bridge_present
        )
        road.risk_score = new_risk

    db.commit()
    db.refresh(road)
    return RoadOut.model_validate(road)

@router.post("", response_model=RoadOut)
def create_road(road_in: RoadCreate, db: Session = Depends(get_db)):
    computed_risk = risk_model.predict_risk(
        rainfall_mm=road_in.avg_rainfall_mm,
        slope_deg=road_in.slope_deg,
        condition=road_in.condition,
        historical_incidents=road_in.historical_incidents,
        bridge_present=road_in.bridge_present
    )

    road = Road(
        name=road_in.name,
        code=road_in.code,
        district_id=road_in.district_id,
        start_lat=road_in.start_lat,
        start_long=road_in.start_long,
        start_name=road_in.start_name,
        end_lat=road_in.end_lat,
        end_long=road_in.end_long,
        end_name=road_in.end_name,
        coordinates_geojson=road_in.coordinates_geojson,
        length_km=road_in.length_km,
        condition=road_in.condition,
        status=road_in.status,
        risk_score=computed_risk,
        slope_deg=road_in.slope_deg,
        avg_rainfall_mm=road_in.avg_rainfall_mm,
        historical_incidents=road_in.historical_incidents,
        bridge_present=road_in.bridge_present,
        bridge_name=road_in.bridge_name,
        is_emergency_corridor=road_in.is_emergency_corridor
    )
    db.add(road)
    db.commit()
    db.refresh(road)
    return RoadOut.model_validate(road)
