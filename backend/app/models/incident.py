import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    # Types: 'Landslide', 'Flood', 'Road Damage', 'Bridge Blocked', 'Traffic Congestion', 'Other'
    type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    # Severity: 'Low', 'Medium', 'High'
    severity = Column(String(20), nullable=False, default="Medium")
    
    lat = Column(Float, nullable=False)
    long = Column(Float, nullable=False)
    road_name = Column(String(150), nullable=True)

    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    # Status: 'Open', 'In Progress', 'Resolved'
    status = Column(String(30), nullable=False, default="Open", index=True)

    photo_url = Column(String(255), nullable=True)
    reported_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(100), nullable=True)
    officer_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    district = relationship("District", back_populates="incidents")
    reporter = relationship("User", foreign_keys=[reported_by_user_id])
