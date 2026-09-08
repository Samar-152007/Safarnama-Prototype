import React, { useState, useEffect } from 'react';
import {
  Route, Sparkles, Navigation, AlertTriangle, ShieldCheck, Clock,
  ArrowRight, CheckCircle2, ChevronRight, Zap, RefreshCw, Info, AlertCircle
} from 'lucide-react';
import { RouteSuggestResponse, RouteOption, Road, District } from '../types';
import { api } from '../services/api';
import { LeafletMap } from '../components/map/LeafletMap';
import { Badge } from '../components/common/Badge';

export const RoutePlannerPage: React.FC = () => {
  const [roads, setRoads] = useState<Road[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Origin & Destination Hubs presets (North East India)
  const hubs = [
    { name: 'Guwahati Logistics Hub (Assam)', lat: 26.1445, lng: 91.7362 },
    { name: 'Shillong Capital Depots (Meghalaya)', lat: 25.5788, lng: 91.8933 },
    { name: 'Silchar Civil Hospital (Barak Valley)', lat: 24.8333, lng: 92.7789 },
    { name: 'Dimapur Gateway Depot (Nagaland)', lat: 25.9064, lng: 93.7271 },
    { name: 'Kohima Relief Terminal (Nagaland)', lat: 25.6751, lng: 94.1086 },
    { name: 'Itanagar Secretariat Hub (Arunachal)', lat: 27.0844, lng: 93.6053 },
  ];

  const [originIndex, setOriginIndex] = useState<number>(0);
  const [destIndex, setDestIndex] = useState<number>(2); // Default Guwahati to Silchar (famous landslide corridor!)
  const [vehicleType, setVehicleType] = useState('Refrigerated Medical Van');
  const [cargoSensitivity, setCargoSensitivity] = useState('High');

  // AI Route suggestion response
  const [routeResult, setRouteResult] = useState<RouteSuggestResponse | null>(null);
  const [activeRouteTab, setActiveRouteTab] = useState<'both' | 'primary' | 'alternate'>('both');

  useEffect(() => {
    Promise.all([api.roads.getAll(), api.districts.getAll()]).then(([r, d]) => {
      setRoads(r);
      setDistricts(d);
    });
    // Auto calculate default route
    calculateRoute(0, 2, 'Refrigerated Medical Van', 'High');
  }, []);

  const calculateRoute = async (
    origIdx = originIndex,
    destIdx = destIndex,
    vType = vehicleType,
    sens = cargoSensitivity
  ) => {
    setIsLoading(true);
    try {
      const orig = hubs[origIdx];
      const dest = hubs[destIdx];
      const res = await api.routes.suggest({
        origin_lat: orig.lat,
        origin_long: orig.lng,
        origin_name: orig.name.split(' (')[0],
        dest_lat: dest.lat,
        dest_long: dest.lng,
        dest_name: dest.name.split(' (')[0],
        vehicle_type: vType,
        cargo_sensitivity: sens
      });
      setRouteResult(res);
    } catch (err) {
      console.error('Error suggesting route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComputeClick = (e: React.FormEvent) => {
    e.preventDefault();
    calculateRoute();
  };

  const primary = routeResult?.primary_route;
  const alternate = routeResult?.alternate_route;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Route className="h-5 w-5 text-teal-400" />
            <span>AI Disruption Risk & Intelligent Rerouting</span>
            <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/20">
              A* Hazard Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predicts landslide risk & rainfall washouts along mountain corridors and provides safe alternate routes
          </p>
        </div>
      </div>

      {/* Main Grid: Control Panel (Left) + Leaflet Dual Route Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Input & Analysis Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleComputeClick} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-teal-400" />
                <span>Mission Waypoints</span>
              </span>
              <span className="text-[11px] text-teal-400 font-semibold">NER Grid</span>
            </div>

            {/* Origin Dropdown */}
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Origin Point</label>
              <select
                value={originIndex}
                onChange={(e) => setOriginIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-medium focus:outline-none focus:border-teal-500"
              >
                {hubs.map((h, i) => (
                  <option key={i} value={i} disabled={i === destIndex}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Dropdown */}
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1">Destination</label>
              <select
                value={destIndex}
                onChange={(e) => setDestIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-medium focus:outline-none focus:border-teal-500"
              >
                {hubs.map((h, i) => (
                  <option key={i} value={i} disabled={i === originIndex}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Profile & Cargo Sensitivity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Vehicle Class</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Refrigerated Medical Van">Refrigerated Medical Van</option>
                  <option value="Standard Heavy Freight">Standard Heavy Truck</option>
                  <option value="Light 4x4 Emergency Pickup">Light 4x4 Emergency Pickup</option>
                  <option value="Fuel / Tanker Truck">Fuel / Hazardous Tanker</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Cargo Priority</label>
                <select
                  value={cargoSensitivity}
                  onChange={(e) => setCargoSensitivity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="High">Critical (Medicines / Food)</option>
                  <option value="Medium">Standard (Produce / Fuel)</option>
                  <option value="Normal">General Freight</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Evaluating Terrain Hazards...' : 'Compute AI Optimized Routes'}</span>
            </button>
          </form>

          {/* AI Comparison Summary Card */}
          {routeResult && primary && (
            <div className="space-y-3">
              {/* Primary Route Card */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                primary.blocked_segments_count > 0 || primary.overall_risk_score > 0.5
                  ? 'bg-red-950/20 border-red-500/30'
                  : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                    <strong className="text-white">{primary.route_name}</strong>
                  </div>
                  <Badge variant={primary.blocked_segments_count > 0 ? 'danger' : 'warning'} size="sm">
                    {primary.blocked_segments_count > 0 ? 'Blocked Highway' : `${(primary.overall_risk_score * 100).toFixed(0)}% Risk`}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-800/40 rounded-xl my-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Distance</div>
                    <div className="font-bold text-slate-100">{primary.total_distance_km} km</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Estimated Time</div>
                    <div className="font-bold text-slate-100">{primary.estimated_time_minutes} min</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Blockages</div>
                    <div className="font-bold text-red-400">{primary.blocked_segments_count} Segments</div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 mt-1">
                  {primary.ai_recommendation}
                </p>
              </div>

              {/* AI Safe Alternate Corridor Card */}
              {alternate && (
                <div className="p-3.5 rounded-2xl border border-teal-500/40 bg-teal-950/20 shadow-xl">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-400" />
                      <strong className="text-teal-200 font-bold">{alternate.route_name}</strong>
                    </div>
                    <Badge variant="success" size="sm">
                      Recommended
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-teal-900/20 rounded-xl my-2 text-xs border border-teal-500/20">
                    <div>
                      <div className="text-[10px] text-slate-400">Safe Distance</div>
                      <div className="font-bold text-teal-300">{alternate.total_distance_km} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Est. Time</div>
                      <div className="font-bold text-teal-300">{alternate.estimated_time_minutes} min</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Hazard Rating</div>
                      <div className="font-bold text-emerald-400">Safe (0 Blocked)</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-teal-100/90 mt-1 leading-relaxed">
                    {alternate.ai_recommendation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Map Display Column */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <LeafletMap
            roads={roads}
            districts={districts}
            primaryRoute={activeRouteTab !== 'alternate' ? primary : null}
            alternateRoute={activeRouteTab !== 'primary' ? alternate : null}
            height="620px"
          />

          {/* Route Layer Selector Pills */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="text-[11px] text-slate-400 font-medium">Map Route Display:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveRouteTab('both')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeRouteTab === 'both' ? 'bg-slate-700 text-teal-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Show Both (Compare)
              </button>
              <button
                onClick={() => setActiveRouteTab('primary')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeRouteTab === 'primary' ? 'bg-slate-700 text-blue-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Primary Only
              </button>
              <button
                onClick={() => setActiveRouteTab('alternate')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeRouteTab === 'alternate' ? 'bg-teal-500/30 text-teal-200 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ✨ AI Safe Alternate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
