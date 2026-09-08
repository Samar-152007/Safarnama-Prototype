from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.district import District
from app.models.incident import Incident
from app.models.vehicle import Vehicle
from app.models.road import Road
from app.models.alert import Alert

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/summary")
def get_analytics_summary(district_id: Optional[int] = None, db: Session = Depends(get_db)):
    # 1. District-wise incident distribution
    dist_query = db.query(District)
    if district_id:
        dist_query = dist_query.filter(District.id == district_id)
    districts = dist_query.all()

    district_incidents = []
    for d in districts:
        count = db.query(Incident).filter(Incident.district_id == d.id).count()
        district_incidents.append({
            "district_id": d.id,
            "district_name": d.name,
            "state": d.state,
            "incident_count": count,
            "connectivity_score": d.connectivity_score
        })

    # 2. Incident types distribution
    inc_type_query = db.query(Incident.type, func.count(Incident.id)).group_by(Incident.type)
    if district_id:
        inc_type_query = inc_type_query.filter(Incident.district_id == district_id)
    type_counts = inc_type_query.all()

    incident_types = [{"type": t, "count": c} for t, c in type_counts]

    # 3. Vehicle Delivery Performance
    veh_query = db.query(Vehicle)
    if district_id:
        veh_query = veh_query.filter(Vehicle.assigned_district_id == district_id)
    vehicles = veh_query.all()

    moving_count = sum(1 for v in vehicles if v.status == "Moving")
    delayed_count = sum(1 for v in vehicles if v.status == "Delayed")
    stopped_count = sum(1 for v in vehicles if v.status == "Stopped")

    commodity_stats = {}
    for v in vehicles:
        commodity_stats[v.commodity_type] = commodity_stats.get(v.commodity_type, 0) + 1

    # 4. Top High-Risk Corridors
    road_query = db.query(Road).filter(Road.risk_score >= 0.45)
    if district_id:
        road_query = road_query.filter(Road.district_id == district_id)
    high_risk_roads = road_query.order_by(Road.risk_score.desc()).limit(10).all()

    high_risk_corridors = []
    for r in high_risk_roads:
        high_risk_corridors.append({
            "id": r.id,
            "name": r.name,
            "code": r.code,
            "district": r.district.name if r.district else "Regional",
            "risk_score": r.risk_score,
            "rainfall_mm": r.avg_rainfall_mm,
            "slope_deg": r.slope_deg,
            "condition": r.condition,
            "status": r.status,
            "bridge_present": r.bridge_present
        })

    # Overall KPIs
    total_roads = db.query(Road).count()
    closed_roads = db.query(Road).filter(Road.status == "Closed").count()
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    open_incidents = db.query(Incident).filter(Incident.status != "Resolved").count()

    accessibility_index = round(((total_roads - closed_roads) / max(total_roads, 1)) * 100, 1)

    return {
        "kpis": {
            "total_vehicles": len(vehicles),
            "moving_vehicles": moving_count,
            "delayed_vehicles": delayed_count,
            "open_incidents": open_incidents,
            "active_alerts": active_alerts,
            "total_roads_monitored": total_roads,
            "closed_roads": closed_roads,
            "accessibility_index": accessibility_index
        },
        "district_incidents": district_incidents,
        "incident_types": incident_types,
        "fleet_status": {
            "moving": moving_count,
            "delayed": delayed_count,
            "stopped": stopped_count,
            "by_commodity": [{"commodity": k, "count": v} for k, v in commodity_stats.items()]
        },
        "high_risk_corridors": high_risk_corridors
    }
