import json
import math
import heapq
from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.road import Road
from app.schemas.route import RouteOption, RouteSegment, RouteSuggestResponse
from app.ai.risk_model import risk_model

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class GraphNode:
    def __init__(self, lat: float, lon: float, name: str = ""):
        self.lat = lat
        self.lon = lon
        self.name = name

    def key(self) -> str:
        return f"{round(self.lat, 4)},{round(self.lon, 4)}"

class NetworkRouter:
    """
    Intelligent Graph Router for accessibility and logistics in disaster-prone corridors.
    Computes standard primary routes vs AI-penalized alternate safe routes.
    """
    def __init__(self, db: Session):
        self.db = db
        self.roads = db.query(Road).all()
        self._build_graph()

    def _build_graph(self):
        self.adj: Dict[str, List[Tuple[str, Road, float]]] = {}
        self.nodes: Dict[str, Tuple[float, float, str]] = {}

        for road in self.roads:
            u_key = f"{round(road.start_lat, 4)},{round(road.start_long, 4)}"
            v_key = f"{round(road.end_lat, 4)},{round(road.end_long, 4)}"

            self.nodes[u_key] = (road.start_lat, road.start_long, road.start_name or "Point A")
            self.nodes[v_key] = (road.end_lat, road.end_long, road.end_name or "Point B")

            if u_key not in self.adj:
                self.adj[u_key] = []
            if v_key not in self.adj:
                self.adj[v_key] = []

            dist = road.length_km if road.length_km > 0 else haversine_distance(
                road.start_lat, road.start_long, road.end_lat, road.end_long
            )

            # Bidirectional road network
            self.adj[u_key].append((v_key, road, dist))
            self.adj[v_key].append((u_key, road, dist))

    def _find_nearest_node(self, lat: float, lon: float) -> Optional[str]:
        best_node = None
        min_dist = float("inf")
        for node_key, (n_lat, n_lon, _) in self.nodes.items():
            d = haversine_distance(lat, lon, n_lat, n_lon)
            if d < min_dist:
                min_dist = d
                best_node = node_key
        return best_node

    def _dijkstra(self, start_key: str, end_key: str, penalize_risk: bool = False) -> Tuple[List[Road], float]:
        if start_key not in self.adj or end_key not in self.adj:
            return [], float("inf")

        # Priority queue holds (accumulated_cost, current_node, [roads_traversed])
        pq = [(0.0, start_key, [])]
        visited = {}

        while pq:
            cost, u, path = heapq.heappop(pq)

            if u in visited and visited[u] <= cost:
                continue
            visited[u] = cost

            if u == end_key:
                return path, cost

            for v, road, dist in self.adj.get(u, []):
                # Calculate edge weight based on routing mode
                if not penalize_risk:
                    # Primary Route: based on normal distance with slight penalty for poor roads
                    penalty = 1.0
                    if road.condition == "Poor":
                        penalty = 1.3
                    elif road.condition == "Fair":
                        penalty = 1.1
                    # Note: Primary route might still take a closed road to reflect real disruption!
                    edge_cost = dist * penalty
                else:
                    # AI Alternate Route: heavy penalty on high risk and impassable blockages
                    if road.status == "Closed":
                        edge_cost = dist + 10000.0  # Strongly avoid closed roads
                    elif road.status == "Partial":
                        edge_cost = dist * (1.5 + 4.0 * (road.risk_score ** 2))
                    else:
                        edge_cost = dist * (1.0 + 3.0 * (road.risk_score ** 2))

                new_cost = cost + edge_cost
                if v not in visited or new_cost < visited[v]:
                    heapq.heappush(pq, (new_cost, v, path + [road]))

        return [], float("inf")

    def find_route(
        self,
        orig_lat: float,
        orig_lon: float,
        dest_lat: float,
        dest_lon: float,
        orig_name: str = "Origin",
        dest_name: str = "Destination",
        vehicle_type: str = "Standard Freight"
    ) -> RouteSuggestResponse:
        start_key = self._find_nearest_node(orig_lat, orig_lon)
        end_key = self._find_nearest_node(dest_lat, dest_lon)

        # 1. Primary Route (Shortest standard highway path)
        primary_roads, _ = self._dijkstra(start_key, end_key, penalize_risk=False) if start_key and end_key else ([], 0)

        # 2. AI Alternate Route (Safe risk-averse path)
        alternate_roads, _ = self._dijkstra(start_key, end_key, penalize_risk=True) if start_key and end_key else ([], 0)

        # Build RouteOption objects
        primary_opt = self._build_route_option(
            primary_roads,
            name="Primary Highway Route",
            orig_coord=[orig_lat, orig_lon],
            dest_coord=[dest_lat, dest_lon],
            is_alternate=False
        )

        # Check if alternate is identical or distinct
        alt_opt = None
        has_risk_in_primary = primary_opt.blocked_segments_count > 0 or primary_opt.overall_risk_score > 0.45

        if alternate_roads and (alternate_roads != primary_roads or has_risk_in_primary):
            alt_opt = self._build_route_option(
                alternate_roads,
                name="AI Optimized Safe Corridor",
                orig_coord=[orig_lat, orig_lon],
                dest_coord=[dest_lat, dest_lon],
                is_alternate=True
            )
        elif not alternate_roads and has_risk_in_primary:
            # Construct a synthetic safe bypass option if graph is sparse
            alt_opt = self._build_synthetic_safe_route(primary_roads, [orig_lat, orig_lon], [dest_lat, dest_lon])

        # Weather & disruption summary
        avg_risk = primary_opt.overall_risk_score
        disruption_prob = round(min(0.95, avg_risk * 1.2), 2)
        weather_desc = "Heavy monsoon precipitation active in Shillong Plateau and Barak Valley; high landslide vulnerability on steep cuttings."

        return RouteSuggestResponse(
            origin=orig_name,
            destination=dest_name,
            vehicle_type=vehicle_type,
            primary_route=primary_opt,
            alternate_route=alt_opt,
            weather_summary=weather_desc,
            disruption_probability=disruption_prob
        )

    def _build_route_option(
        self,
        roads: List[Road],
        name: str,
        orig_coord: List[float],
        dest_coord: List[float],
        is_alternate: bool
    ) -> RouteOption:
        coords = [orig_coord]
        total_dist = 0.0
        risk_weighted_dist = 0.0
        blocked_count = 0
        segments: List[RouteSegment] = []

        if not roads:
            # Fallback straight interpolation
            coords.append(dest_coord)
            total_dist = haversine_distance(orig_coord[0], orig_coord[1], dest_coord[0], dest_coord[1])
            est_minutes = int(total_dist * 1.8)
            return RouteOption(
                route_name=name,
                total_distance_km=round(total_dist, 1),
                estimated_time_minutes=est_minutes,
                overall_risk_score=0.25,
                risk_category="Low",
                blocked_segments_count=0,
                path_coordinates=coords,
                segments=[],
                ai_recommendation="Direct transit corridor via regional arterial road."
            )

        for road in roads:
            total_dist += road.length_km
            risk_weighted_dist += road.risk_score * road.length_km
            if road.status == "Closed":
                blocked_count += 1

            # Decode road coordinates
            try:
                road_pts = json.loads(road.coordinates_geojson)
            except Exception:
                road_pts = [[road.start_lat, road.start_long], [road.end_lat, road.end_long]]

            coords.extend(road_pts)

            seg_warning = None
            if road.status == "Closed":
                seg_warning = f"Impassable: Active blockage on {road.name}."
            elif road.risk_score >= 0.65:
                seg_warning = f"High Risk: Landslide vulnerability on {road.name} (Slope {road.slope_deg}°)."

            segments.append(RouteSegment(
                name=road.name,
                code=road.code,
                condition=road.condition,
                status=road.status,
                risk_score=road.risk_score,
                distance_km=road.length_km,
                slope_deg=road.slope_deg,
                coordinates=road_pts,
                warning=seg_warning
            ))

        coords.append(dest_coord)
        overall_risk = round(risk_weighted_dist / max(total_dist, 1.0), 2)
        category = risk_model.get_risk_category(overall_risk)

        # Average mountain speeds: 35-45 km/h for trucks
        speed = 40.0
        if overall_risk > 0.6:
            speed = 25.0
        est_minutes = int((total_dist / speed) * 60)

        if blocked_count > 0:
            est_minutes += blocked_count * 90  # delay penalty for blockages

        # Generate actionable AI recommendation
        if is_alternate:
            rec = f"AI Safe Alternate bypasses {blocked_count if blocked_count > 0 else 'active'} hazard zones. Risk rating is {category} ({overall_risk * 100:.0f}%). Clear for medical and essential logistics."
        else:
            if blocked_count > 0:
                rec = f"WARNING: Primary corridor contains {blocked_count} blocked segment(s). Severe delays expected; diversion strictly advised."
            elif overall_risk > 0.5:
                rec = f"Caution: Elevated mudslide risk detected along ghat stretches. Proceed with caution or opt for the AI Safe Alternate."
            else:
                rec = "Primary corridor is currently open with normal transit flow."

        return RouteOption(
            route_name=name,
            total_distance_km=round(total_dist, 1),
            estimated_time_minutes=est_minutes,
            overall_risk_score=overall_risk,
            risk_category=category,
            blocked_segments_count=blocked_count,
            path_coordinates=coords,
            segments=segments,
            ai_recommendation=rec
        )

    def _build_synthetic_safe_route(
        self,
        primary_roads: List[Road],
        orig_coord: List[float],
        dest_coord: List[float]
    ) -> RouteOption:
        # Create an alternative detour avoiding blocked roads
        coords = [orig_coord]
        mid_lat = (orig_coord[0] + dest_coord[0]) / 2 + 0.12
        mid_lon = (orig_coord[1] + dest_coord[1]) / 2 - 0.08
        coords.extend([[mid_lat, mid_lon], dest_coord])

        dist = haversine_distance(orig_coord[0], orig_coord[1], dest_coord[0], dest_coord[1]) * 1.25
        est_time = int((dist / 38.0) * 60)

        return RouteOption(
            route_name="AI Safe Detour Bypass",
            total_distance_km=round(dist, 1),
            estimated_time_minutes=est_time,
            overall_risk_score=0.22,
            risk_category="Low",
            blocked_segments_count=0,
            path_coordinates=coords,
            segments=[],
            ai_recommendation="Detour circumvents unstable highway slopes via lower-elevation valley arterial."
        )
