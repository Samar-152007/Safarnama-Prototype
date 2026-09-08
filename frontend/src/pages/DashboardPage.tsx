import React, { useState, useEffect } from 'react';
import {
  Truck, AlertTriangle, ShieldCheck, Activity, RefreshCw,
  Navigation, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LeafletMap } from '../components/map/LeafletMap';
import { Road, Vehicle, Incident, District, Alert } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const { role } = useAuth();
  const [roads, setRoads] = useState<Road[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState<Road | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [r, v, inc, d, a] = await Promise.all([
        api.roads.getAll(),
        api.vehicles.getAll(),
        api.incidents.getAll(),
        api.districts.getAll(),
        api.alerts.getAll({ is_resolved: false })
      ]);
      setRoads(r);
      setVehicles(v);
      setIncidents(inc);
      setDistricts(d);
      setAlerts(a);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSimulateFleetStep = async () => {
    setIsSimulating(true);
    try {
      const updated = await api.vehicles.simulateStep();
      setVehicles(updated);
    } catch (err) {
      console.error('Simulation step error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // KPIs
  const totalRoads = roads.length;
  const closedRoads = roads.filter(r => r.status === 'Closed').length;
  const movingVehicles = vehicles.filter(v => v.status === 'Moving').length;
  const delayedVehicles = vehicles.filter(v => v.status === 'Delayed').length;
  const openIncidents = incidents.filter(i => i.status !== 'Resolved').length;
  const accessibilityIndex = totalRoads > 0
    ? Math.round(((totalRoads - closedRoads) / totalRoads) * 100)
    : 92;

  // Logistics Bottlenecks
  const bottlenecks = roads.filter(r => r.status === 'Closed' || r.risk_score >= 0.65);
  // Emergency safe routes
  const emergencyCorridors = roads.filter(r => r.is_emergency_corridor && r.status === 'Open');

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner & KPI Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            GIS Accessibility & Smart Logistics Command Center
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Live Monitoring
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time highway accessibility, landslide prediction, and essential supply convoy tracking for North East India
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateFleetStep}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Advance fleet GPS coordinates to demonstrate live tracking"
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Simulate Fleet Movement</span>
          </button>

          <button
            onClick={loadDashboardData}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title="Refresh GIS Feeds"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Regional Accessibility"
          value={`${accessibilityIndex}%`}
          subtitle={`${closedRoads} highway segment(s) closed`}
          icon={ShieldCheck}
          variant={accessibilityIndex > 85 ? 'teal' : 'amber'}
        />
        <StatCard
          title="Tracked Cargo Fleet"
          value={vehicles.length}
          subtitle={`${movingVehicles} transit active, ${delayedVehicles} delayed`}
          icon={Truck}
          variant="blue"
        />
        <StatCard
          title="Open Field Hazards"
          value={openIncidents}
          subtitle="Landslides, floods & damage"
          icon={AlertTriangle}
          variant={openIncidents > 3 ? 'red' : 'amber'}
        />
        <StatCard
          title="Active System Alerts"
          value={alerts.length}
          subtitle="Proactive rule-based warnings"
          icon={Activity}
          variant="purple"
        />
      </div>

      {/* Main Grid: GIS Map (Left) + Intelligence Panels (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Leaflet Map Column */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <LeafletMap
            roads={roads}
            vehicles={vehicles}
            incidents={incidents}
            districts={districts}
            onSelectRoad={(road) => setSelectedRoad(road)}
            onSelectVehicle={(veh) => onNavigate('vehicles')}
            onSelectIncident={(inc) => onNavigate('incidents')}
            height="580px"
          />

          {/* Quick interactive hint */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
              <span>Click on any highway, vehicle, or hazard marker on the map for instant intelligence & actions</span>
            </div>
            <button
              onClick={() => onNavigate('routes')}
              className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              <span>Launch AI Route Planner</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right Intelligence Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* District Connectivity Status Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  District Connectivity
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">7 NER Districts</span>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {districts.map((d) => {
                const score = Math.round(d.connectivity_score);
                const isWarning = score < 80;
                return (
                  <div key={d.id} className="p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="font-semibold text-slate-200">
                        {d.name} <span className="text-[10px] font-normal text-slate-400">({d.state})</span>
                      </div>
                      <span className={`font-bold ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {score}%
                      </span>
                    </div>
                    {/* Connectivity Progress Bar */}
                    <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Hazards: <strong className="text-slate-300">{d.open_incidents_count || 0}</strong></span>
                      <span>Blocked: <strong className="text-red-400">{d.blocked_roads_count || 0}</strong></span>
                      <span>Fleet: <strong className="text-cyan-400">{d.active_vehicles_count || 0}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics Bottlenecks List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Critical Bottlenecks
                </h3>
              </div>
              <Badge variant="danger" size="sm">{bottlenecks.length} Critical</Badge>
            </div>

            <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
              {bottlenecks.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No active highway closures</div>
              ) : (
                bottlenecks.map((road) => (
                  <div
                    key={road.id}
                    onClick={() => setSelectedRoad(road)}
                    className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate">{road.code}: {road.name}</span>
                      <span className="text-[10px] font-bold text-red-400 uppercase">{road.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {road.status === 'Closed' ? 'Total blockage from rockslide/structural damage' : `Elevated risk ${(road.risk_score * 100).toFixed(0)}% with ${road.avg_rainfall_mm}mm rain`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Emergency Corridors Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Recommended Safe Corridors
                </h3>
              </div>
              <Badge variant="info" size="sm">Disaster Relief</Badge>
            </div>

            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
              {emergencyCorridors.slice(0, 3).map((corridor) => (
                <div key={corridor.id} className="p-2 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{corridor.code}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{corridor.name}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">Clear & Open</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
