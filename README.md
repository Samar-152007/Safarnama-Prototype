# 🗺️ Safarnama (सफ़रनामा)
### *Every Journey Safe, Every Route Smart*

**Safarnama** is an AI-powered Smart Logistics and Accessibility Intelligence Platform designed for disaster-prone and mountainous regions in India (starting with the North Eastern Region: Assam, Meghalaya, Nagaland, Arunachal Pradesh, Sikkim), architected to scale nationwide and globally.

The platform assists disaster management authorities (NDRF/SDRF), civil supplies officers, health logistics coordinators, and emergency convoy drivers in maintaining uninterrupted transport of essential commodities (**life-saving medicines, food grains/PDS, agricultural produce, and construction equipment**) during heavy monsoon downpours, flash floods, and landslides.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Administrator**: National & regional oversight across all districts, user management, and road network controls.
   - **District Officer**: Localized district view, clearance approvals, and analytical vulnerability assessments.
   - **Field User / Logistics**: Field hazard reporting with auto-GPS & photo uploads, convoy status tracking, and route alerts.

2. **GIS-Enabled Accessibility Monitoring (Leaflet + OSM)**:
   - Live color-coded road network:
     - 🟢 **Green**: Accessible / Good condition.
     - 🟡 **Amber**: Partial blockage / Slow crawl.
     - 🔴 **Red**: Blocked / High hazard risk.
   - District boundaries with connectivity indices.
   - Ground hazard markers (Landslides, Flash Floods, Bridge Damaged, Rockfalls) with geotagged photo popups.
   - Real-time vehicle markers colored by essential commodity category.

3. **AI Landslide & Flood Hazard Assessment**:
   - Multi-factor hazard estimation based on 24-hour antecedent rainfall (mm), mountain slope gradient (°), road pavement conditions, and historical washout counts.
   - Predicts risk scores ($0.0 - 1.0$) and categorizes risk into Low, Medium, High, or Critical.

4. **Intelligent Dynamic Rerouting (A* / Dijkstra Graph Engine)**:
   - Computes **Primary Route** (standard highway path) and evaluates disruption probability.
   - Computes **AI Safe Alternate Corridor** dynamically penalizing high-hazard and closed road segments to route essential supplies around landslides.
   - Side-by-side comparison of distance, travel time, and AI terrain advisories.

5. **Automated Intelligence Alert Rule Engine**:
   - Automatically triggers alerts when:
     - Road status transitions to `Closed` (`BlockedRoad` alert).
     - Predicted hazard score exceeds threshold with high precipitation (`HighRiskCorridor` alert).
     - Convoy ETA exceeds delivery delay limits (`DelayedDelivery` alert).
     - Heavy regional rainfall warnings (`WeatherWarning` alert).

6. **Field-Level Incident Reporting with Photo Geotags**:
   - Auto-detects GPS coordinates or allows pin-drop on map.
   - Photo upload and instant map synchronization.
   - Officer status workflow: `Open` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Leaflet, Lucide Icons.
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Scikit-Learn, NumPy, Pydantic, Direct Bcrypt, Python-Jose (JWT).
- **Database**: Dual-mode engine:
  - Local Zero-Friction: SQLite with spatial GeoJSON models (runs out of the box).
  - Cloud Production: PostgreSQL + PostGIS (with included `postgis_schema.sql` for Supabase / AWS RDS).
- **Deployment**: Vercel (Frontend) + Render / Fly.io (Backend).

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
- *Note: On first startup, the backend automatically creates tables and seeds rich North East India logistics and GIS data.*

### 2. Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🔑 Demo Access Credentials

You can log in manually using the following credentials or use the **Quick Demo Switcher** directly on the login page or top navigation bar:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@safarnama.gov.in` | `admin123` | National & Regional (All 7 Districts) |
| **District Officer** | `officer@safarnama.gov.in` | `officer123` | East Khasi Hills (Shillong) |
| **Field User** | `field@safarnama.gov.in` | `field123` | Cachar (Silchar) |
| **District Officer (Nagaland)** | `officer.kohima@safarnama.gov.in` | `officer123` | Kohima District |

---

## 📡 REST API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Email/password login returning JWT token and user profile |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `GET` | `/api/districts` | List all districts with real-time connectivity and incident metrics |
| `GET` | `/api/roads` | List roads with status, condition, and AI hazard score filters |
| `PUT` | `/api/roads/{id}` | Update road status/rainfall (triggers AI risk re-evaluation) |
| `GET` | `/api/vehicles` | List tracked cargo fleet with commodity and status filters |
| `POST` | `/api/vehicles/simulate-step` | Advances fleet GPS coordinates along route geometry |
| `GET` | `/api/incidents` | Query field incidents with multi-parameter filtering |
| `POST` | `/api/incidents` | Submit new incident with coordinates and photo upload |
| `PUT` | `/api/incidents/{id}` | Officer verification (Open $\rightarrow$ In Progress $\rightarrow$ Resolved) |
| `GET` | `/api/alerts` | List active hazard, road blockage, and delayed delivery alerts |
| `POST` | `/api/alerts/scan-rules` | Trigger automated backend rule engine |
| `PUT` | `/api/alerts/{id}/resolve` | Acknowledge and resolve an active alert |
| `POST` | `/api/routes/suggest` | AI Route suggestion (Primary vs Alternate safe corridor) |
| `GET` | `/api/analytics/summary` | Aggregated KPIs, district vulnerability, and convoy reliability |

---

## 🗄️ Production PostGIS Deployment (Supabase)

To deploy the database to Supabase or any managed PostgreSQL instance with PostGIS:
1. In your Supabase Project Dashboard, open the **SQL Editor**.
2. Run the SQL script found at `backend/postgis_schema.sql`.
3. Set the `DATABASE_URL` environment variable in your backend deployment:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```
