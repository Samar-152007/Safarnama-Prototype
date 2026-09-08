export type UserRole = 'admin' | 'officer' | 'field_user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  district_id?: number;
  password?: string;
  is_active: boolean;
  created_at: string;
}

export interface District {
  id: number;
  name: string;
  state: string;
  center_lat: number;
  center_long: number;
  polygon_geojson?: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  connectivity_score: number;
  open_incidents_count?: number;
  active_vehicles_count?: number;
  blocked_roads_count?: number;
}

export interface Road {
  id: number;
  name: string;
  code: string;
  district_id?: number;
  start_lat: number;
  start_long: number;
  start_name?: string;
  end_lat: number;
  end_long: number;
  end_name?: string;
  coordinates_geojson: string; // parsed as [lat, lng][]
  length_km: number;
  condition: 'Good' | 'Fair' | 'Poor';
  status: 'Open' | 'Partial' | 'Closed';
  risk_score: number;
  slope_deg: number;
  avg_rainfall_mm: number;
  historical_incidents: number;
  bridge_present: boolean;
  bridge_name?: string;
  is_emergency_corridor: boolean;
}

export type CommodityType = 'Medicines' | 'Food/PDS' | 'Construction' | 'Agricultural Produce';
export type VehicleStatus = 'Moving' | 'Stopped' | 'Delayed';

export interface Vehicle {
  id: number;
  vehicle_number: string;
  driver_name: string;
  driver_phone?: string;
  commodity_type: CommodityType;
  current_lat: number;
  current_long: number;
  heading_deg?: number;
  speed_kmh: number;
  origin_name: string;
  dest_name: string;
  origin_lat?: number;
  origin_long?: number;
  dest_lat?: number;
  dest_long?: number;
  route_geojson?: string;
  current_step_index?: number;
  status: VehicleStatus;
  eta_minutes: number;
  delay_reason?: string;
  assigned_district_id?: number;
  last_update_time: string;
}

export type IncidentType = 'Landslide' | 'Flood' | 'Road Damage' | 'Bridge Blocked' | 'Traffic Congestion' | 'Other';
export type IncidentSeverity = 'Low' | 'Medium' | 'High';
export type IncidentStatus = 'Open' | 'In Progress' | 'Resolved';

export interface Incident {
  id: number;
  type: IncidentType;
  description: string;
  severity: IncidentSeverity;
  lat: number;
  long: number;
  road_name?: string;
  district_id?: number;
  status: IncidentStatus;
  photo_url?: string;
  reported_by_user_id?: number;
  reporter_name?: string;
  officer_notes?: string;
  created_at: string;
  updated_at: string;
}

export type AlertType = 'BlockedRoad' | 'HighRiskCorridor' | 'DelayedDelivery' | 'WeatherWarning';
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Alert {
  id: number;
  title: string;
  description: string;
  severity: AlertSeverity;
  district_id?: number;
  related_road_id?: number;
  related_vehicle_id?: number;
  type: AlertType;
  is_resolved: boolean;
  created_at: string;
  district_name?: string;
  road_name?: string;
  vehicle_number?: string;
}

export interface RouteSegment {
  name: string;
  code: string;
  condition: string;
  status: string;
  risk_score: number;
  distance_km: number;
  slope_deg: number;
  coordinates: [number, number][];
  warning?: string;
}

export interface RouteOption {
  route_name: string;
  total_distance_km: number;
  estimated_time_minutes: number;
  overall_risk_score: number;
  risk_category: 'Low' | 'Medium' | 'High' | 'Critical';
  blocked_segments_count: number;
  path_coordinates: [number, number][];
  segments: RouteSegment[];
  ai_recommendation: string;
}

export interface RouteSuggestResponse {
  origin: string;
  destination: string;
  vehicle_type: string;
  primary_route: RouteOption;
  alternate_route?: RouteOption;
  weather_summary: string;
  disruption_probability: number;
}

export interface AnalyticsSummary {
  kpis: {
    total_vehicles: number;
    moving_vehicles: number;
    delayed_vehicles: number;
    open_incidents: number;
    active_alerts: number;
    total_roads_monitored: number;
    closed_roads: number;
    accessibility_index: number;
  };
  district_incidents: {
    district_id: number;
    district_name: string;
    state: string;
    incident_count: number;
    connectivity_score: number;
  }[];
  incident_types: {
    type: string;
    count: number;
  }[];
  fleet_status: {
    moving: number;
    delayed: number;
    stopped: number;
    by_commodity: { commodity: string; count: number }[];
  };
  high_risk_corridors: {
    id: number;
    name: string;
    code: string;
    district: string;
    risk_score: number;
    rainfall_mm: number;
    slope_deg: number;
    condition: string;
    status: string;
    bridge_present: boolean;
  }[];
}
