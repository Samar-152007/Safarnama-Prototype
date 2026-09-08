import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, nullable=False, index=True)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=True)

    # Commodity: 'Medicines', 'Food/PDS', 'Construction', 'Agricultural Produce'
    commodity_type = Column(String(50), nullable=False, default="Medicines")
    
    current_lat = Column(Float, nullable=False)
    current_long = Column(Float, nullable=False)
    heading_deg = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=45.0)

    origin_name = Column(String(100), nullable=False)
    dest_name = Column(String(100), nullable=False)
    origin_lat = Column(Float, nullable=True)
    origin_long = Column(Float, nullable=True)
    dest_lat = Column(Float, nullable=True)
    dest_long = Column(Float, nullable=True)

    # Planned / Active route polyline coordinates JSON
    route_geojson = Column(Text, nullable=True)
    current_step_index = Column(Integer, default=0)

    # Status: 'Moving', 'Stopped', 'Delayed'
    status = Column(String(30), nullable=False, default="Moving")
    eta_minutes = Column(Integer, default=120)
    delay_reason = Column(String(200), nullable=True)

    assigned_district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    last_update_time = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    district = relationship("District", back_populates="vehicles")
    alerts = relationship("Alert", back_populates="vehicle")
