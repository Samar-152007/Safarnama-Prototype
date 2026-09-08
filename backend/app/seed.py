import json
import bcrypt
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.district import District
from app.models.road import Road
from app.models.vehicle import Vehicle
from app.models.incident import Incident
from app.models.alert import Alert
from app.ai.risk_model import risk_model

def get_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(District).first():
        print("Database already contains records. Skipping seed.")
        db.close()
        return

    print("Seeding Safarnama database with North East India logistics & terrain data...")

    # 1. SEED DISTRICTS (North Eastern Region)
    districts_data = [
        {
            "id": 1,
            "name": "Kamrup Metropolitan",
            "state": "Assam",
            "center_lat": 26.1445,
            "center_long": 91.7362,
            "polygon_geojson": json.dumps([
                [26.25, 91.60], [26.28, 91.85], [26.05, 91.95], [26.02, 91.65], [26.25, 91.60]
            ]),
            "risk_level": "Low",
            "connectivity_score": 94.5
        },
        {
            "id": 2,
            "name": "East Khasi Hills",
            "state": "Meghalaya",
            "center_lat": 25.5788,
            "center_long": 91.8933,
            "polygon_geojson": json.dumps([
                [25.75, 91.75], [25.70, 92.05], [25.40, 92.10], [25.35, 91.68], [25.75, 91.75]
            ]),
            "risk_level": "High",
            "connectivity_score": 76.2
        },
        {
            "id": 3,
            "name": "Cachar",
            "state": "Assam",
            "center_lat": 24.8333,
            "center_long": 92.7789,
            "polygon_geojson": json.dumps([
                [25.05, 92.60], [25.02, 93.00], [24.60, 93.10], [24.55, 92.65], [25.05, 92.60]
            ]),
            "risk_level": "High",
            "connectivity_score": 71.8
        },
        {
            "id": 4,
            "name": "Kohima",
            "state": "Nagaland",
            "center_lat": 25.6751,
            "center_long": 94.1086,
            "polygon_geojson": json.dumps([
                [25.85, 94.00], [25.80, 94.25], [25.50, 94.30], [25.45, 93.95], [25.85, 94.00]
            ]),
            "risk_level": "Medium",
            "connectivity_score": 82.0
        },
        {
            "id": 5,
            "name": "Dimapur",
            "state": "Nagaland",
            "center_lat": 25.9064,
            "center_long": 93.7271,
            "polygon_geojson": json.dumps([
                [26.05, 93.60], [26.00, 93.85], [25.78, 93.88], [25.75, 93.62], [26.05, 93.60]
            ]),
            "risk_level": "Low",
            "connectivity_score": 92.0
        },
        {
            "id": 6,
            "name": "Ri-Bhoi",
            "state": "Meghalaya",
            "center_lat": 25.9056,
            "center_long": 91.8803,
            "polygon_geojson": json.dumps([
                [26.08, 91.75], [26.05, 92.02], [25.75, 92.00], [25.72, 91.70], [26.08, 91.75]
            ]),
            "risk_level": "Medium",
            "connectivity_score": 85.0
        },
        {
            "id": 7,
            "name": "Papum Pare",
            "state": "Arunachal Pradesh",
            "center_lat": 27.0844,
            "center_long": 93.6053,
            "polygon_geojson": json.dumps([
                [27.30, 93.45], [27.28, 93.85], [26.90, 93.80], [26.88, 93.40], [27.30, 93.45]
            ]),
            "risk_level": "High",
            "connectivity_score": 74.0
        }
    ]

    for d in districts_data:
        db.add(District(**d))
    db.commit()

    # 2. SEED USERS (Role-based access)
    users_data = [
        {
            "name": "Dr. Rajesh Sharma (Director General)",
            "email": "admin@safarnama.gov.in",
            "password_hash": get_hash("admin123"),
            "role": "admin",
            "phone": "+91-9864012345",
            "district_id": 1,
            "is_active": True
        },
        {
            "name": "Pynskhem Lyndem (District Disaster Officer)",
            "email": "officer@safarnama.gov.in",
            "password_hash": get_hash("officer123"),
            "role": "officer",
            "phone": "+91-9856023456",
            "district_id": 2,  # East Khasi Hills (Shillong)
            "is_active": True
        },
        {
            "name": "Debabrata Das (Field Logistics Coordinator)",
            "email": "field@safarnama.gov.in",
            "password_hash": get_hash("field123"),
            "role": "field_user",
            "phone": "+91-9435034567",
            "district_id": 3,  # Cachar (Silchar)
            "is_active": True
        },
        {
            "name": "Temsula Ao (District Logistics Officer)",
            "email": "officer.kohima@safarnama.gov.in",
            "password_hash": get_hash("officer123"),
            "role": "officer",
            "phone": "+91-9436045678",
            "district_id": 4,  # Kohima
            "is_active": True
        }
    ]

    for u in users_data:
        db.add(User(**u))
    db.commit()

    # 3. SEED ROADS & HIGHWAYS (High-density North East Network)
    roads_data = [
        # Segment 1: Guwahati to Jorabat (NH-27)
        {
            "name": "Guwahati - Jorabat Expressway (NH-27)",
            "code": "NH-27",
            "district_id": 1,
            "start_lat": 26.1445, "start_long": 91.7362, "start_name": "Guwahati Hub",
            "end_lat": 26.1082, "end_long": 91.8724, "end_name": "Jorabat Junction",
            "coordinates_geojson": json.dumps([
                [26.1445, 91.7362], [26.1350, 91.7800], [26.1200, 91.8250], [26.1082, 91.8724]
            ]),
            "length_km": 18.5,
            "condition": "Good", "status": "Open",
            "slope_deg": 4.0, "avg_rainfall_mm": 18.0, "historical_incidents": 0,
            "bridge_present": True, "bridge_name": "Khanapara Flyover", "is_emergency_corridor": True
        },
        # Segment 2: Jorabat to Nongpoh (NH-6)
        {
            "name": "Jorabat - Nongpoh Hill Highway (NH-6)",
            "code": "NH-6",
            "district_id": 6,
            "start_lat": 26.1082, "start_long": 91.8724, "start_name": "Jorabat Junction",
            "end_lat": 25.9056, "end_long": 91.8803, "end_name": "Nongpoh Transit Point",
            "coordinates_geojson": json.dumps([
                [26.1082, 91.8724], [26.0450, 91.8650], [25.9800, 91.8750], [25.9056, 91.8803]
            ]),
            "length_km": 32.0,
            "condition": "Fair", "status": "Open",
            "slope_deg": 14.5, "avg_rainfall_mm": 35.0, "historical_incidents": 2,
            "bridge_present": True, "bridge_name": "Umtru River Bridge", "is_emergency_corridor": True
        },
        # Segment 3: Nongpoh to Umiam (NH-6)
        {
            "name": "Nongpoh - Umiam Lake Sector (NH-6)",
            "code": "NH-6",
            "district_id": 6,
            "start_lat": 25.9056, "start_long": 91.8803, "start_name": "Nongpoh Transit Point",
            "end_lat": 25.6700, "end_long": 91.9050, "end_name": "Umiam Dam Bypass",
            "coordinates_geojson": json.dumps([
                [25.9056, 91.8803], [25.8200, 91.8900], [25.7400, 91.9000], [25.6700, 91.9050]
            ]),
            "length_km": 34.0,
            "condition": "Good", "status": "Open",
            "slope_deg": 16.0, "avg_rainfall_mm": 42.0, "historical_incidents": 1,
            "bridge_present": True, "bridge_name": "Umiam Spillway Bridge", "is_emergency_corridor": True
        },
        # Segment 4: Umiam to Shillong (NH-6)
        {
            "name": "Umiam - Shillong Capital Artery (NH-6)",
            "code": "NH-6",
            "district_id": 2,
            "start_lat": 25.6700, "start_long": 91.9050, "start_name": "Umiam Dam Bypass",
            "end_lat": 25.5788, "end_long": 91.8933, "end_name": "Shillong City Center",
            "coordinates_geojson": json.dumps([
                [25.6700, 91.9050], [25.6250, 91.9000], [25.5950, 91.8920], [25.5788, 91.8933]
            ]),
            "length_km": 15.0,
            "condition": "Good", "status": "Open",
            "slope_deg": 18.0, "avg_rainfall_mm": 48.0, "historical_incidents": 1,
            "bridge_present": False, "bridge_name": None, "is_emergency_corridor": True
        },
        # Segment 5: Shillong to Jowai (NH-6 - Landslide prone)
        {
            "name": "Shillong - Jowai Plateau Ghat (NH-6)",
            "code": "NH-6",
            "district_id": 2,
            "start_lat": 25.5788, "start_long": 91.8933, "start_name": "Shillong City Center",
            "end_lat": 25.4450, "end_long": 92.2050, "end_name": "Jowai Junction",
            "coordinates_geojson": json.dumps([
                [25.5788, 91.8933], [25.5200, 91.9800], [25.4800, 92.1100], [25.4450, 92.2050]
            ]),
            "length_km": 64.0,
            "condition": "Poor", "status": "Closed", # BLOCKED FOR REAL DEMO!
            "slope_deg": 28.5, "avg_rainfall_mm": 95.0, "historical_incidents": 7,
            "bridge_present": True, "bridge_name": "Myntdu Gorge Bridge", "is_emergency_corridor": False
        },
        # Segment 6: Shillong - Mairang - Nongstoin Safe Bypass (Alternate NH-106)
        {
            "name": "Shillong - Mairang - Nongstoin Corridor (NH-106)",
            "code": "NH-106",
            "district_id": 2,
            "start_lat": 25.5788, "start_long": 91.8933, "start_name": "Shillong City Center",
            "end_lat": 25.5200, "end_long": 91.2700, "end_name": "Nongstoin Junction",
            "coordinates_geojson": json.dumps([
                [25.5788, 91.8933], [25.5600, 91.6400], [25.5450, 91.4500], [25.5200, 91.2700]
            ]),
            "length_km": 78.0,
            "condition": "Good", "status": "Open",
            "slope_deg": 12.0, "avg_rainfall_mm": 28.0, "historical_incidents": 0,
            "bridge_present": True, "bridge_name": "Kynshi River Bridge", "is_emergency_corridor": True
        },
        # Segment 7: Jowai to Sonapur Tunnel (NH-6 - Landslide sector)
        {
            "name": "Jowai - Sonapur Tunnel Sector (NH-6)",
            "code": "NH-6",
            "district_id": 2,
            "start_lat": 25.4450, "start_long": 92.2050, "start_name": "Jowai Junction",
            "end_lat": 25.1050, "end_long": 92.3650, "end_name": "Sonapur Tunnel Exit",
            "coordinates_geojson": json.dumps([
                [25.4450, 92.2050], [25.3200, 92.2800], [25.1800, 92.3400], [25.1050, 92.3650]
            ]),
            "length_km": 52.0,
            "condition": "Poor", "status": "Partial",
            "slope_deg": 35.0, "avg_rainfall_mm": 110.0, "historical_incidents": 9,
            "bridge_present": True, "bridge_name": "Lubha Suspension Bridge", "is_emergency_corridor": False
        },
        # Segment 8: Sonapur to Badarpur / Silchar (NH-6)
        {
            "name": "Sonapur - Silchar Gateway (NH-6 / NH-37)",
            "code": "NH-37",
            "district_id": 3,
            "start_lat": 25.1050, "start_long": 92.3650, "start_name": "Sonapur Tunnel Exit",
            "end_lat": 24.8333, "end_long": 92.7789, "end_name": "Silchar Logistics Hub",
            "coordinates_geojson": json.dumps([
                [25.1050, 92.3650], [24.9500, 92.5100], [24.8700, 92.6500], [24.8333, 92.7789]
            ]),
            "length_km": 58.0,
            "condition": "Fair", "status": "Open",
            "slope_deg": 10.0, "avg_rainfall_mm": 65.0, "historical_incidents": 3,
            "bridge_present": True, "bridge_name": "Barak River Bridge", "is_emergency_corridor": True
        },
        # Segment 9: Guwahati to Nagaon (NH-27)
        {
            "name": "Guwahati - Nagaon Central Corridor (NH-27)",
            "code": "NH-27",
            "district_id": 1,
            "start_lat": 26.1445, "start_long": 91.7362, "start_name": "Guwahati Hub",
            "end_lat": 26.3450, "end_long": 92.6850, "end_name": "Nagaon Junction",
            "coordinates_geojson": json.dumps([
                [26.1445, 91.7362], [26.1900, 92.0500], [26.2400, 92.3500], [26.3450, 92.6850]
            ]),
            "length_km": 115.0,
            "condition": "Good", "status": "Open",
            "slope_deg": 3.0, "avg_rainfall_mm": 22.0, "historical_incidents": 0,
            "bridge_present": True, "bridge_name": "Kolong Bridge", "is_emergency_corridor": True
        },
        # Segment 10: Nagaon to Dimapur (NH-29 / NH-27)
        {
            "name": "Nagaon - Doboka - Dimapur Highway (NH-29)",
            "code": "NH-29",
            "district_id": 5,
            "start_lat": 26.3450, "start_long": 92.6850, "start_name": "Nagaon Junction",
            "end_lat": 25.9064, "end_long": 93.7271, "end_name": "Dimapur Gateway",
            "coordinates_geojson": json.dumps([
                [26.3450, 92.6850], [26.1500, 93.1000], [25.9800, 93.4500], [25.9064, 93.7271]
            ]),
            "length_km": 130.0,
            "condition": "Good", "status": "Open",
            "slope_deg": 6.5, "avg_rainfall_mm": 26.0, "historical_incidents": 1,
            "bridge_present": True, "bridge_name": "Dhansiri River Bridge", "is_emergency_corridor": True
        },
        # Segment 11: Dimapur to Kohima (NH-29 - Critical Nagaland lifeline)
        {
            "name": "Dimapur - Kohima Hill Lifeline (NH-29)",
            "code": "NH-29",
            "district_id": 4,
            "start_lat": 25.9064, "start_long": 93.7271, "start_name": "Dimapur Gateway",
            "end_lat": 25.6751, "end_long": 94.1086, "end_name": "Kohima Capital Terminal",
            "coordinates_geojson": json.dumps([
                [25.9064, 93.7271], [25.8200, 93.8800], [25.7400, 93.9900], [25.6751, 94.1086]
            ]),
            "length_km": 68.0,
            "condition": "Fair", "status": "Partial",
            "slope_deg": 24.0, "avg_rainfall_mm": 55.0, "historical_incidents": 4,
            "bridge_present": True, "bridge_name": "Chathe River Bridge", "is_emergency_corridor": True
        },
        # Segment 12: Dimapur - Zubza bypass (Alternate to Kohima)
        {
            "name": "Dimapur - Zubza Valley Bypass",
            "code": "SH-6",
            "district_id": 4,
            "start_lat": 25.9064, "start_long": 93.7271, "start_name": "Dimapur Gateway",
            "end_lat": 25.6751, "end_long": 94.1086, "end_name": "Kohima Capital Terminal",
            "coordinates_geojson": json.dumps([
                [25.9064, 93.7271], [25.8700, 93.8200], [25.7600, 94.0200], [25.6751, 94.1086]
            ]),
            "length_km": 74.0,
            "condition": "Good", "status": "Open",
            "slope_deg": 14.0, "avg_rainfall_mm": 30.0, "historical_incidents": 1,
            "bridge_present": True, "bridge_name": "Zubza Bailey Bridge", "is_emergency_corridor": True
        },
        # Segment 13: Guwahati - Mangaldai - Itanagar (NH-15 / NH-415)
        {
            "name": "Guwahati - Tezpur - Itanagar Northern Link (NH-415)",
            "code": "NH-415",
            "district_id": 7,
            "start_lat": 26.1445, "start_long": 91.7362, "start_name": "Guwahati Hub",
            "end_lat": 27.0844, "end_long": 93.6053, "end_name": "Itanagar Secretariat",
            "coordinates_geojson": json.dumps([
                [26.1445, 91.7362], [26.4500, 92.2000], [26.6500, 92.8000], [27.0844, 93.6053]
            ]),
            "length_km": 280.0,
            "condition": "Fair", "status": "Open",
            "slope_deg": 18.0, "avg_rainfall_mm": 62.0, "historical_incidents": 3,
            "bridge_present": True, "bridge_name": "Kolia Bhomora Setu", "is_emergency_corridor": True
        },
        # Segment 14: Silchar - Haflong - Lumding link (NH-27 hill section)
        {
            "name": "Silchar - Haflong - Lumding Disaster Detour (NH-27)",
            "code": "NH-27",
            "district_id": 3,
            "start_lat": 24.8333, "start_long": 92.7789, "start_name": "Silchar Logistics Hub",
            "end_lat": 26.3450, "end_long": 92.6850, "end_name": "Nagaon Junction",
            "coordinates_geojson": json.dumps([
                [24.8333, 92.7789], [25.1800, 92.9500], [25.7500, 93.0500], [26.3450, 92.6850]
            ]),
            "length_km": 210.0,
            "condition": "Fair", "status": "Open",
            "slope_deg": 22.0, "avg_rainfall_mm": 50.0, "historical_incidents": 5,
            "bridge_present": True, "bridge_name": "Jatinga River Span", "is_emergency_corridor": True
        }
    ]

    for r in roads_data:
        # Calculate AI hazard risk score using the model
        risk = risk_model.predict_risk(
            rainfall_mm=r["avg_rainfall_mm"],
            slope_deg=r["slope_deg"],
            condition=r["condition"],
            historical_incidents=r["historical_incidents"],
            bridge_present=r["bridge_present"]
        )
        r["risk_score"] = risk
        db.add(Road(**r))
    db.commit()

    # 4. SEED TRACKED FLEET VEHICLES
    vehicles_data = [
        {
            "vehicle_number": "AS-01-GC-4921",
            "driver_name": "Biren Saikia",
            "driver_phone": "+91-9864198210",
            "commodity_type": "Medicines",
            "current_lat": 26.0450, "current_long": 91.8650,
            "heading_deg": 145.0, "speed_kmh": 42.0,
            "origin_name": "Guwahati Medical College Depot",
            "dest_name": "NEIGRIHMS Hospital, Shillong",
            "origin_lat": 26.1445, "origin_long": 91.7362,
            "dest_lat": 25.5788, "dest_long": 91.8933,
            "route_geojson": json.dumps([
                [26.1445, 91.7362], [26.1082, 91.8724], [26.0450, 91.8650],
                [25.9800, 91.8750], [25.9056, 91.8803], [25.6700, 91.9050], [25.5788, 91.8933]
            ]),
            "current_step_index": 2,
            "status": "Moving",
            "eta_minutes": 65,
            "delay_reason": None,
            "assigned_district_id": 6
        },
        {
            "vehicle_number": "AS-11-BC-8832",
            "driver_name": "Nurul Islam Laskar",
            "driver_phone": "+91-9435182930",
            "commodity_type": "Medicines",
            "current_lat": 25.1050, "current_long": 92.3650,
            "heading_deg": 130.0, "speed_kmh": 15.0,
            "origin_name": "Guwahati Central Drug Store",
            "dest_name": "Silchar Civil Hospital",
            "origin_lat": 26.1445, "origin_long": 91.7362,
            "dest_lat": 24.8333, "dest_long": 92.7789,
            "route_geojson": json.dumps([
                [25.4450, 92.2050], [25.3200, 92.2800], [25.1800, 92.3400],
                [25.1050, 92.3650], [24.9500, 92.5100], [24.8333, 92.7789]
            ]),
            "current_step_index": 3,
            "status": "Delayed",
            "eta_minutes": 210,
            "delay_reason": "Severe bottleneck at Sonapur Tunnel mudslide clearance",
            "assigned_district_id": 2
        },
        {
            "vehicle_number": "ML-05-D-7210",
            "driver_name": "Wanphrang Nongrum",
            "driver_phone": "+91-9856172341",
            "commodity_type": "Food/PDS",
            "current_lat": 25.5600, "current_long": 91.6400,
            "heading_deg": 260.0, "speed_kmh": 38.0,
            "origin_name": "FCI Godown, Khanapara",
            "dest_name": "Nongstoin Civil Sub-division PDS",
            "origin_lat": 26.1082, "origin_long": 91.8724,
            "dest_lat": 25.5200, "dest_long": 91.2700,
            "route_geojson": json.dumps([
                [25.5788, 91.8933], [25.5600, 91.6400], [25.5450, 91.4500], [25.5200, 91.2700]
            ]),
            "current_step_index": 1,
            "status": "Moving",
            "eta_minutes": 85,
            "delay_reason": None,
            "assigned_district_id": 2
        },
        {
            "vehicle_number": "NL-07-A-1109",
            "driver_name": "Vilhoutuo Kire",
            "driver_phone": "+91-9436123490",
            "commodity_type": "Food/PDS",
            "current_lat": 25.8200, "current_long": 93.8800,
            "heading_deg": 120.0, "speed_kmh": 32.0,
            "origin_name": "Dimapur Railway Food Yard",
            "dest_name": "Kohima State Food Reserve",
            "origin_lat": 25.9064, "origin_long": 93.7271,
            "dest_lat": 25.6751, "dest_long": 94.1086,
            "route_geojson": json.dumps([
                [25.9064, 93.7271], [25.8200, 93.8800], [25.7400, 93.9900], [25.6751, 94.1086]
            ]),
            "current_step_index": 1,
            "status": "Moving",
            "eta_minutes": 75,
            "delay_reason": None,
            "assigned_district_id": 4
        },
        {
            "vehicle_number": "AS-01-EE-3341",
            "driver_name": "Dhaniram Barman",
            "driver_phone": "+91-9864234509",
            "commodity_type": "Agricultural Produce",
            "current_lat": 26.1900, "current_long": 92.0500,
            "heading_deg": 75.0, "speed_kmh": 50.0,
            "origin_name": "Khetri Organic Pineapples Hub",
            "dest_name": "Nagaon Wholesale Mandi",
            "origin_lat": 26.1445, "origin_long": 91.7362,
            "dest_lat": 26.3450, "dest_long": 92.6850,
            "route_geojson": json.dumps([
                [26.1445, 91.7362], [26.1900, 92.0500], [26.2400, 92.3500], [26.3450, 92.6850]
            ]),
            "current_step_index": 1,
            "status": "Moving",
            "eta_minutes": 95,
            "delay_reason": None,
            "assigned_district_id": 1
        },
        {
            "vehicle_number": "AR-01-B-9980",
            "driver_name": "Tashi Wangchuk",
            "driver_phone": "+91-9402188321",
            "commodity_type": "Construction",
            "current_lat": 26.6500, "current_long": 92.8000,
            "heading_deg": 40.0, "speed_kmh": 46.0,
            "origin_name": "Guwahati Steel Warehouse",
            "dest_name": "Itanagar Highway Expansion Project",
            "origin_lat": 26.1445, "origin_long": 91.7362,
            "dest_lat": 27.0844, "dest_long": 93.6053,
            "route_geojson": json.dumps([
                [26.1445, 91.7362], [26.4500, 92.2000], [26.6500, 92.8000], [27.0844, 93.6053]
            ]),
            "current_step_index": 2,
            "status": "Moving",
            "eta_minutes": 150,
            "delay_reason": None,
            "assigned_district_id": 7
        },
        {
            "vehicle_number": "AS-24-C-5512",
            "driver_name": "Jiten Hazarika",
            "driver_phone": "+91-9864771234",
            "commodity_type": "Medicines",
            "current_lat": 25.4450, "current_long": 92.2050,
            "heading_deg": 0.0, "speed_kmh": 0.0,
            "origin_name": "Shillong Civil Medical Store",
            "dest_name": "Jowai District Hospital",
            "origin_lat": 25.5788, "origin_long": 91.8933,
            "dest_lat": 25.4450, "dest_long": 92.2050,
            "route_geojson": json.dumps([[25.5788, 91.8933], [25.4450, 92.2050]]),
            "current_step_index": 1,
            "status": "Stopped",
            "eta_minutes": 0,
            "delay_reason": "Waiting at Jowai depot checkpoint",
            "assigned_district_id": 2
        }
    ]

    for v in vehicles_data:
        db.add(Vehicle(**v))
    db.commit()

    # 5. SEED INCIDENTS (Landslides, floods, bridge damage, rockfalls)
    incidents_data = [
        {
            "type": "Landslide",
            "description": "Massive debris flow blocking both carriage ways on NH-6 near Sonapur Tunnel. Clearance earthmovers deployed.",
            "severity": "High",
            "lat": 25.1050, "long": 92.3650,
            "road_name": "Jowai - Sonapur Tunnel Sector (NH-6)",
            "district_id": 2,
            "status": "Open",
            "photo_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
            "reporter_name": "Debabrata Das (Field Coordinator)",
            "officer_notes": "SDRF and NHAI teams clearing boulders. High rainfall hampering operation."
        },
        {
            "type": "Flood",
            "description": "Barak River backflow submerged 400m of approach road near Silchar Sadarghat. Light vehicles halted.",
            "severity": "High",
            "lat": 24.8333, "long": 92.7789,
            "road_name": "Sonapur - Silchar Gateway (NH-6 / NH-37)",
            "district_id": 3,
            "status": "In Progress",
            "photo_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
            "reporter_name": "District Patrol Unit Cachar",
            "officer_notes": "Inundation level 1.2 ft. Heavy trucks passing with caution; convoy escorts arranged."
        },
        {
            "type": "Road Damage",
            "description": "Deep asphalt fissure and retaining wall subsidence at Km 48 near Phesama along Kohima corridor.",
            "severity": "Medium",
            "lat": 25.6450, "long": 94.1020,
            "road_name": "Dimapur - Kohima Hill Lifeline (NH-29)",
            "district_id": 4,
            "status": "Open",
            "photo_url": "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=600&q=80",
            "reporter_name": "Traffic Police Kohima",
            "officer_notes": "Single lane operational. Geotechnical inspection team en route."
        },
        {
            "type": "Bridge Blocked",
            "description": "Myntdu Gorge bridge bearing damage caused by heavy flash flood torrents. Structural safety alert issued.",
            "severity": "High",
            "lat": 25.4450, "long": 92.2050,
            "road_name": "Shillong - Jowai Plateau Ghat (NH-6)",
            "district_id": 2,
            "status": "Open",
            "photo_url": "https://images.unsplash.com/photo-1545972154-9bb223aac798?auto=format&fit=crop&w=600&q=80",
            "reporter_name": "Pynskhem Lyndem (Officer)",
            "officer_notes": "Bridge closed for all heavy vehicular movement until PWD safety certification."
        },
        {
            "type": "Landslide",
            "description": "Mudslide on Umsning curve along NH-6. Single lane cleared by local JCB unit.",
            "severity": "Medium",
            "lat": 25.7500, "long": 91.8900,
            "road_name": "Nongpoh - Umiam Lake Sector (NH-6)",
            "district_id": 6,
            "status": "Resolved",
            "photo_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80",
            "reporter_name": "Ri-Bhoi Traffic Control",
            "officer_notes": "Resolved: Full two-lane transit restored at 14:30 hrs."
        },
        {
            "type": "Traffic Congestion",
            "description": "Overturned timber lorry causing 4km tailback near Khanapara boundary interchange.",
            "severity": "Low",
            "lat": 26.1150, "long": 91.8500,
            "road_name": "Guwahati - Jorabat Expressway (NH-27)",
            "district_id": 1,
            "status": "In Progress",
            "photo_url": None,
            "reporter_name": "Highway Patrol 04",
            "officer_notes": "Crane arriving to upright vehicle. Congestion clearing."
        },
        {
            "type": "Landslide",
            "description": "Rockfall on Papum Pare hill cutting near Banderdewa gateway into Arunachal Pradesh.",
            "severity": "Medium",
            "lat": 27.0500, "long": 93.5800,
            "road_name": "Guwahati - Tezpur - Itanagar Northern Link (NH-415)",
            "district_id": 7,
            "status": "Open",
            "photo_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
            "reporter_name": "Arunachal Border Roads Org",
            "officer_notes": "Loose boulders being cleared by BRO."
        }
    ]

    for inc in incidents_data:
        db.add(Incident(**inc))
    db.commit()

    # 6. SEED INITIAL CRITICAL ALERTS
    alerts_data = [
        {
            "title": "Blocked Road: Shillong - Jowai Ghat (NH-6)",
            "description": "Complete road closure on NH-6 at Myntdu Gorge due to severe bridge bearing shift and landslide. Divert via NH-106 Nongstoin.",
            "severity": "Critical",
            "district_id": 2,
            "related_road_id": 5,
            "type": "BlockedRoad",
            "is_resolved": False
        },
        {
            "title": "High Risk Corridor: Sonapur Tunnel Sector (NH-6)",
            "description": "AI Hazard Index: 89% (Critical). Continuous heavy rainfall (110mm) and 35° steep slope vulnerability. High probability of recurring mudslides.",
            "severity": "High",
            "district_id": 2,
            "related_road_id": 7,
            "type": "HighRiskCorridor",
            "is_resolved": False
        },
        {
            "title": "Delayed Critical Delivery: AS-11-BC-8832 (Medicines)",
            "description": "Consignment carrying essential rabies vaccines and IV fluids to Silchar Civil Hospital delayed by 210 minutes due to Sonapur bottleneck.",
            "severity": "High",
            "district_id": 2,
            "related_vehicle_id": 2,
            "type": "DelayedDelivery",
            "is_resolved": False
        },
        {
            "title": "Monsoon Weather Warning: Heavy Precipitation in Khasi & Jaintia Hills",
            "description": "IMD Red Warning: 24h rainfall exceeded 95mm across Cherrapunji-Mawsynram ridge. Flash floods anticipated in lower valleys.",
            "severity": "High",
            "district_id": 2,
            "type": "WeatherWarning",
            "is_resolved": False
        }
    ]

    for a in alerts_data:
        db.add(Alert(**a))
    db.commit()

    print("Safarnama North East database successfully initialized with rich demo data!")
    db.close()

if __name__ == "__main__":
    seed_database()
