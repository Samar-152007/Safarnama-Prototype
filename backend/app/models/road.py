from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    code = Column(String(50), nullable=False)  # e.g., NH-27, NH-6, SH-14
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)

    start_lat = Column(Float, nullable=False)
    start_long = Column(Float, nullable=False)
    start_name = Column(String(100), nullable=True)

    end_lat = Column(Float, nullable=False)
    end_long = Column(Float, nullable=False)
    end_name = Column(String(100), nullable=True)

    coordinates_geojson = Column(Text, nullable=False)  # JSON array of [lat, lng] pairs
    length_km = Column(Float, default=10.0)

    condition = Column(String(20), default="Good")  # 'Good', 'Fair', 'Poor'
    status = Column(String(20), default="Open")     # 'Open', 'Partial', 'Closed'
    risk_score = Column(Float, default=0.15)        # 0.0 to 1.0 (calculated by AI engine)

    slope_deg = Column(Float, default=12.0)
    avg_rainfall_mm = Column(Float, default=25.0)
    historical_incidents = Column(Integer, default=1)
    bridge_present = Column(Boolean, default=False)
    bridge_name = Column(String(100), nullable=True)
    is_emergency_corridor = Column(Boolean, default=False)

    district = relationship("District", back_populates="roads")
    alerts = relationship("Alert", back_populates="road")
