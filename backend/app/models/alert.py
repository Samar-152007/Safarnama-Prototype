import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    
    # Severity: 'Low', 'Medium', 'High', 'Critical'
    severity = Column(String(20), nullable=False, default="High")

    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    related_road_id = Column(Integer, ForeignKey("roads.id"), nullable=True)
    related_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)

    # Type: 'BlockedRoad', 'HighRiskCorridor', 'DelayedDelivery', 'WeatherWarning'
    type = Column(String(50), nullable=False, index=True)

    is_resolved = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    district = relationship("District", back_populates="alerts")
    road = relationship("Road", back_populates="alerts")
    vehicle = relationship("Vehicle", back_populates="alerts")
