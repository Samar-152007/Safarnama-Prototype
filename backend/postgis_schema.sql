-- ====================================================================
-- SAFARNAMA PLATFORM: POSTGRESQL + POSTGIS DATABASE SCHEMA
-- Designed for deployment on Supabase or AWS RDS / Neon PostgreSQL
-- ====================================================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Districts table with Polygon geometry
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    state VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_long DOUBLE PRECISION NOT NULL,
    polygon_geojson TEXT,
    geom GEOMETRY(POLYGON, 4326),
    risk_level VARCHAR(20) DEFAULT 'Low',
    connectivity_score DOUBLE PRECISION DEFAULT 90.0
);

-- 3. Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'field_user', -- 'admin', 'officer', 'field_user'
    phone VARCHAR(20),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Roads table with Linestring geometry and AI risk metrics
CREATE TABLE IF NOT EXISTS roads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    start_lat DOUBLE PRECISION NOT NULL,
    start_long DOUBLE PRECISION NOT NULL,
    start_name VARCHAR(100),
    end_lat DOUBLE PRECISION NOT NULL,
    end_long DOUBLE PRECISION NOT NULL,
    end_name VARCHAR(100),
    coordinates_geojson TEXT NOT NULL,
    geom GEOMETRY(LINESTRING, 4326),
    length_km DOUBLE PRECISION DEFAULT 10.0,
    condition VARCHAR(20) DEFAULT 'Good', -- 'Good', 'Fair', 'Poor'
    status VARCHAR(20) DEFAULT 'Open',    -- 'Open', 'Partial', 'Closed'
    risk_score DOUBLE PRECISION DEFAULT 0.15,
    slope_deg DOUBLE PRECISION DEFAULT 12.0,
    avg_rainfall_mm DOUBLE PRECISION DEFAULT 25.0,
    historical_incidents INTEGER DEFAULT 1,
    bridge_present BOOLEAN DEFAULT FALSE,
    bridge_name VARCHAR(100),
    is_emergency_corridor BOOLEAN DEFAULT FALSE
);

-- 5. Vehicles table with Point geometry and route tracking
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20),
    commodity_type VARCHAR(50) NOT NULL DEFAULT 'Medicines',
    current_lat DOUBLE PRECISION NOT NULL,
    current_long DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(POINT, 4326),
    heading_deg DOUBLE PRECISION DEFAULT 0.0,
    speed_kmh DOUBLE PRECISION DEFAULT 45.0,
    origin_name VARCHAR(100) NOT NULL,
    dest_name VARCHAR(100) NOT NULL,
    origin_lat DOUBLE PRECISION,
    origin_long DOUBLE PRECISION,
    dest_lat DOUBLE PRECISION,
    dest_long DOUBLE PRECISION,
    route_geojson TEXT,
    current_step_index INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Moving', -- 'Moving', 'Stopped', 'Delayed'
    eta_minutes INTEGER DEFAULT 120,
    delay_reason VARCHAR(200),
    assigned_district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    last_update_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Incidents table with Point geometry and media
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'Landslide', 'Flood', 'Road Damage', 'Bridge Blocked', 'Traffic Congestion', 'Other'
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    lat DOUBLE PRECISION NOT NULL,
    long DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(POINT, 4326),
    road_name VARCHAR(150),
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved'
    photo_url VARCHAR(255),
    reported_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reporter_name VARCHAR(100),
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Alerts table for proactive hazard and bottleneck notices
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'High', -- 'Low', 'Medium', 'High', 'Critical'
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    related_road_id INTEGER REFERENCES roads(id) ON DELETE SET NULL,
    related_vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'BlockedRoad', 'HighRiskCorridor', 'DelayedDelivery', 'WeatherWarning'
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Spatial Indexes (GIST) for high-performance spatial queries
CREATE INDEX IF NOT EXISTS idx_districts_geom ON districts USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_roads_geom ON roads USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_vehicles_geom ON vehicles USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents USING GIST (geom);
