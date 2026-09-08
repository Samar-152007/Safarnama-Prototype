from sqlalchemy.orm import Session
from app.models.road import Road
from app.models.vehicle import Vehicle
from app.models.alert import Alert

class AlertRuleEngine:
    """
    Automated Intelligence Rule Engine that continuously audits road infrastructure,
    weather conditions, and delivery timetables to trigger proactive alerts.
    """
    @staticmethod
    def run_rules(db: Session) -> int:
        new_alerts_count = 0

        # Rule 1: Road blocked -> 'BlockedRoad' alert
        closed_roads = db.query(Road).filter(Road.status == "Closed").all()
        for road in closed_roads:
            existing = db.query(Alert).filter(
                Alert.related_road_id == road.id,
                Alert.type == "BlockedRoad",
                Alert.is_resolved == False
            ).first()

            if not existing:
                alert = Alert(
                    title=f"Blocked Road: {road.name} ({road.code})",
                    description=f"Critical transit disruption on {road.name}. Road status is CLOSED due to active hazard. Traffic diverted.",
                    severity="Critical",
                    district_id=road.district_id,
                    related_road_id=road.id,
                    type="BlockedRoad"
                )
                db.add(alert)
                new_alerts_count += 1

        # Rule 2: Landslide / Flood risk score > 0.70 & high rainfall -> 'HighRiskCorridor' alert
        high_risk_roads = db.query(Road).filter(
            Road.risk_score >= 0.70,
            Road.avg_rainfall_mm >= 40.0,
            Road.status != "Closed"
        ).all()
        for road in high_risk_roads:
            existing = db.query(Alert).filter(
                Alert.related_road_id == road.id,
                Alert.type == "HighRiskCorridor",
                Alert.is_resolved == False
            ).first()

            if not existing:
                alert = Alert(
                    title=f"High Risk Corridor: {road.name}",
                    description=f"Predicted landslide/flood risk index is {road.risk_score * 100:.0f}% with heavy precipitation ({road.avg_rainfall_mm}mm). High vulnerability for heavy freight.",
                    severity="High",
                    district_id=road.district_id,
                    related_road_id=road.id,
                    type="HighRiskCorridor"
                )
                db.add(alert)
                new_alerts_count += 1

        # Rule 3: Vehicle delayed or ETA > threshold -> 'DelayedDelivery' alert
        delayed_vehicles = db.query(Vehicle).filter(
            (Vehicle.status == "Delayed") | (Vehicle.eta_minutes >= 240)
        ).all()
        for veh in delayed_vehicles:
            existing = db.query(Alert).filter(
                Alert.related_vehicle_id == veh.id,
                Alert.type == "DelayedDelivery",
                Alert.is_resolved == False
            ).first()

            if not existing:
                alert = Alert(
                    title=f"Delayed Critical Cargo: {veh.vehicle_number} ({veh.commodity_type})",
                    description=f"Vehicle carrying {veh.commodity_type} en route from {veh.origin_name} to {veh.dest_name} is delayed. Current ETA is {veh.eta_minutes} mins. Reason: {veh.delay_reason or 'Terrain bottleneck'}.",
                    severity="High" if veh.commodity_type in ["Medicines", "Food/PDS"] else "Medium",
                    district_id=veh.assigned_district_id,
                    related_vehicle_id=veh.id,
                    type="DelayedDelivery"
                )
                db.add(alert)
                new_alerts_count += 1

        if new_alerts_count > 0:
            db.commit()

        return new_alerts_count
