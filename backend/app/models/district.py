from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    state = Column(String(100), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_long = Column(Float, nullable=False)
    polygon_geojson = Column(Text, nullable=True)  # Stored as GeoJSON Polygon string
    risk_level = Column(String(20), default="Low")  # 'Low', 'Medium', 'High', 'Critical'
    connectivity_score = Column(Float, default=90.0)  # Percentage 0-100

    users = relationship("User", back_populates="district")
    roads = relationship("Road", back_populates="district")
    incidents = relationship("Incident", back_populates="district")
    alerts = relationship("Alert", back_populates="district")
    vehicles = relationship("Vehicle", back_populates="district")
