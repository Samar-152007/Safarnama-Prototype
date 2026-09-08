from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.models.district import District
from app.models.road import Road
from app.models.vehicle import Vehicle
from app.schemas.alert import AlertOut, AlertCreate
from app.ai.alert_engine import AlertRuleEngine

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    district_id: Optional[int] = None,
    type: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if district_id:
        query = query.filter(Alert.district_id == district_id)
    if type:
        query = query.filter(Alert.type == type)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)

    # Return newest first
    alerts = query.order_by(Alert.created_at.desc()).all()
    out = []
    for a in alerts:
        d_name = a.district.name if a.district else None
        r_name = a.road.name if a.road else None
        v_num = a.vehicle.vehicle_number if a.vehicle else None

        item = AlertOut(
            id=a.id,
            title=a.title,
            description=a.description,
            severity=a.severity,
            district_id=a.district_id,
            related_road_id=a.related_road_id,
            related_vehicle_id=a.related_vehicle_id,
            type=a.type,
            is_resolved=a.is_resolved,
            created_at=a.created_at,
            district_name=d_name,
            road_name=r_name,
            vehicle_number=v_num
        )
        out.append(item)
    return out

@router.post("", response_model=AlertOut)
def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    alert = Alert(
        title=alert_in.title,
        description=alert_in.description,
        severity=alert_in.severity,
        district_id=alert_in.district_id,
        related_road_id=alert_in.related_road_id,
        related_vehicle_id=alert_in.related_vehicle_id,
        type=alert_in.type,
        is_resolved=False
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return AlertOut.model_validate(alert)

@router.put("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return AlertOut.model_validate(alert)

@router.post("/scan-rules")
def trigger_rule_engine(db: Session = Depends(get_db)):
    """Triggers the automated rule engine to audit roads and delivery delays."""
    new_alerts = AlertRuleEngine.run_rules(db)
    return {"message": f"Rule scan completed. {new_alerts} new alert(s) triggered.", "new_alerts": new_alerts}
