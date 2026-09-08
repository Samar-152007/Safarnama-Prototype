import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.road import Road
from app.schemas.route import RouteSuggestRequest, RouteSuggestResponse, RiskSegmentResponse
from app.ai.router_engine import NetworkRouter
from app.ai.risk_model import risk_model

router = APIRouter(prefix="", tags=["Routing & Risk"])

@router.post("/routes/suggest", response_model=RouteSuggestResponse)
def suggest_route(req: RouteSuggestRequest, db: Session = Depends(get_db)):
    router_engine = NetworkRouter(db)
    result = router_engine.find_route(
        orig_lat=req.origin_lat,
        orig_lon=req.origin_long,
        dest_lat=req.dest_lat,
        dest_lon=req.dest_long,
        orig_name=req.origin_name or "Origin",
        dest_name=req.dest_name or "Destination",
        vehicle_type=req.vehicle_type or "Heavy Logistics Truck"
    )
    return result

@router.get("/risk/segments", response_model=List[RiskSegmentResponse])
def get_risk_segments(
    district_id: Optional[int] = None,
    min_risk: Optional[float] = Query(0.0, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    query = db.query(Road)
    if district_id:
        query = query.filter(Road.district_id == district_id)
    if min_risk > 0.0:
        query = query.filter(Road.risk_score >= min_risk)

    roads = query.all()
    results = []
    for r in roads:
        try:
            coords = json.loads(r.coordinates_geojson)
        except Exception:
            coords = [[r.start_lat, r.start_long], [r.end_lat, r.end_long]]

        category = risk_model.get_risk_category(r.risk_score)

        results.append(RiskSegmentResponse(
            id=r.id,
            name=r.name,
            code=r.code,
            risk_score=r.risk_score,
            risk_category=category,
            rainfall_mm=r.avg_rainfall_mm,
            slope_deg=r.slope_deg,
            condition=r.condition,
            status=r.status,
            coordinates=coords
        ))
    return results
