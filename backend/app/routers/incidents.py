import os
import uuid
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.incident import Incident
from app.models.user import User
from app.schemas.incident import IncidentOut, IncidentCreate, IncidentUpdate
from app.routers.auth import get_current_user
from app.ai.alert_engine import AlertRuleEngine

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentOut])
def list_incidents(
    district_id: Optional[int] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if district_id:
        query = query.filter(Incident.district_id == district_id)
    if type:
        query = query.filter(Incident.type == type)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)

    # Order newest first
    query = query.order_by(Incident.created_at.desc())
    return [IncidentOut.model_validate(inc) for inc in query.all()]

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentOut.model_validate(inc)

@router.post("", response_model=IncidentOut)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None
    reporter = current_user.name if current_user else (incident_in.reporter_name or "Field Patrol Unit")

    incident = Incident(
        type=incident_in.type,
        description=incident_in.description,
        severity=incident_in.severity,
        lat=incident_in.lat,
        long=incident_in.long,
        road_name=incident_in.road_name,
        district_id=incident_in.district_id,
        photo_url=incident_in.photo_url,
        reported_by_user_id=user_id,
        reporter_name=reporter,
        status="Open"
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Trigger rule engine to generate alerts if needed
    try:
        AlertRuleEngine.run_rules(db)
    except Exception:
        pass

    return IncidentOut.model_validate(incident)

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"incident_{uuid.uuid4().hex[:10]}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"photo_url": f"/uploads/{filename}", "filename": filename}

@router.put("/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    inc_update: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if inc_update.status is not None:
        inc.status = inc_update.status
    if inc_update.severity is not None:
        inc.severity = inc_update.severity
    if inc_update.officer_notes is not None:
        inc.officer_notes = inc_update.officer_notes
    if inc_update.description is not None:
        inc.description = inc_update.description

    inc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)
    return IncidentOut.model_validate(inc)
