import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Road, Vehicle, Incident, District, RouteOption } from '../../types';
import { Layers, Eye, EyeOff, Navigation, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface LeafletMapProps {
  roads?: Road[];
  vehicles?: Vehicle[];
  incidents?: Incident[];
  districts?: District[];
  primaryRoute?: RouteOption | null;
  alternateRoute?: RouteOption | null;
  highlightedVehicle?: Vehicle | null;
  onMapClick?: (lat: number, lng: number) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectIncident?: (incident: Incident) => void;
  onSelectRoad?: (road: Road) => void;
  interactivePicker?: boolean;
  pickerPosition?: [number, number] | null;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  roads = [],
  vehicles = [],
  incidents = [],
  districts = [],
  primaryRoute = null,
  alternateRoute = null,
  highlightedVehicle = null,
  onMapClick,
  onSelectVehicle,
  onSelectIncident,
  onSelectRoad,
  interactivePicker = false,
  pickerPosition = null,
  height = 'calc(100vh - 120px)'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const roadsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const vehiclesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const incidentsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const districtsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const pickerLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // Visibility toggles
  const [showRoads, setShowRoads] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [filterCommodity, setFilterCommodity] = useState<string>('all');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on North East India: Guwahati / Meghalaya / Nagaland junction
    const map = L.map(mapContainerRef.current, {
      center: [25.80, 92.40],
      zoom: 8,
      minZoom: 6,
      maxZoom: 17,
      zoomControl: true,
    });

    // High performance CartoDB Dark Matter / Positron tiles (OpenStreetMap base, no API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add layer groups to map
    roadsLayerRef.current.addTo(map);
    districtsLayerRef.current.addTo(map);
    vehiclesLayerRef.current.addTo(map);
    incidentsLayerRef.current.addTo(map);
    routesLayerRef.current.addTo(map);
    pickerLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [onMapClick]);

  // Render Interactive Picker Pin
  useEffect(() => {
    pickerLayerRef.current.clearLayers();
    if (pickerPosition && mapInstanceRef.current) {
      const pinIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position: relative; transform: translate(-50%, -100%);">
            <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: #0D9488; transform: rotate(-45deg); border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
              <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 12px; height: 4px; background: rgba(0,0,0,0.4); border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      L.marker(pickerPosition, { icon: pinIcon }).addTo(pickerLayerRef.current);
    }
  }, [pickerPosition]);

  // Render District Boundaries
  useEffect(() => {
    districtsLayerRef.current.clearLayers();
    if (!showDistricts) return;

    districts.forEach((d) => {
      if (!d.polygon_geojson) return;
      try {
        const polyCoords = JSON.parse(d.polygon_geojson);
        const polygon = L.polygon(polyCoords, {
          color: d.risk_level === 'High' ? '#EF4444' : d.risk_level === 'Medium' ? '#F59E0B' : '#0D9488',
          weight: 1.5,
          opacity: 0.7,
          fillColor: d.risk_level === 'High' ? '#EF4444' : '#14B8A6',
          fillOpacity: 0.08,
          dashArray: '4, 4'
        });

        polygon.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px;">
            <strong style="color: #0F172A;">${d.name} (${d.state})</strong><br/>
            Risk Status: <span style="font-weight: 600; color: ${d.risk_level === 'High' ? '#DC2626' : '#0D9488'}">${d.risk_level}</span><br/>
            Accessibility: <strong>${d.connectivity_score}%</strong>
          </div>
        `, { sticky: true });

        polygon.addTo(districtsLayerRef.current);
      } catch (e) {
        console.warn('Could not parse district polygon:', e);
      }
    });
  }, [districts, showDistricts]);

  // Render Roads
  useEffect(() => {
    roadsLayerRef.current.clearLayers();
    if (!showRoads) return;

    roads.forEach((road) => {
      try {
        const coords = JSON.parse(road.coordinates_geojson);
        let color = '#10B981'; // Green: Open / Accessible
        let weight = 4.5;
        let dashArray = undefined;

        if (road.status === 'Closed') {
          color = '#EF4444'; // Red: Closed / Blocked
          weight = 5.5;
          dashArray = '6, 6';
        } else if (road.status === 'Partial' || road.risk_score >= 0.5) {
          color = '#F59E0B'; // Amber: Partial / Slow
          weight = 5;
        }

        const polyline = L.polyline(coords, {
          color,
          weight,
          opacity: 0.9,
          dashArray,
          lineJoin: 'round',
          lineCap: 'round'
        });

        const statusBadgeColor =
          road.status === 'Open' ? '#10B981' : road.status === 'Partial' ? '#F59E0B' : '#EF4444';

        polyline.bindPopup(`
          <div style="min-width: 220px; font-family: inherit; color: #f8fafc;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: 13px; color: #fff;">${road.name}</span>
              <span style="background: ${statusBadgeColor}25; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeColor}50; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px;">
                ${road.status.toUpperCase()}
              </span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
              <div>Highway: <strong style="color:#e2e8f0;">${road.code}</strong></div>
              <div>Length: <strong style="color:#e2e8f0;">${road.length_km} km</strong></div>
              <div>Condition: <strong style="color:#e2e8f0;">${road.condition}</strong></div>
              <div>AI Hazard Risk: <strong style="color:${road.risk_score > 0.6 ? '#ef4444' : '#10b981'};">${(road.risk_score * 100).toFixed(0)}%</strong></div>
              <div>Slope: <strong style="color:#e2e8f0;">${road.slope_deg}°</strong></div>
              <div>24h Rain: <strong style="color:#38bdf8;">${road.avg_rainfall_mm} mm</strong></div>
            </div>
            ${road.bridge_present ? `<div style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">🌉 Bridge: ${road.bridge_name || 'Major River Span'}</div>` : ''}
            ${road.is_emergency_corridor ? `<div style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 4px 6px; border-radius: 4px;">🛡️ Designated Disaster Relief Corridor</div>` : ''}
          </div>
        `);

        polyline.on('click', () => {
          if (onSelectRoad) onSelectRoad(road);
        });

        polyline.addTo(roadsLayerRef.current);
      } catch (e) {
        console.warn('Failed to parse road coords:', e);
      }
    });
  }, [roads, showRoads, onSelectRoad]);

  // Render Vehicles
  useEffect(() => {
    vehiclesLayerRef.current.clearLayers();
    if (!showVehicles) return;

    const filteredVehicles = vehicles.filter(v => 
      filterCommodity === 'all' || v.commodity_type === filterCommodity
    );

    filteredVehicles.forEach((veh) => {
      const commodityColors: Record<string, string> = {
        'Medicines': '#06B6D4',
        'Food/PDS': '#F59E0B',
        'Construction': '#F97316',
        'Agricultural Produce': '#10B981'
      };
      const color = commodityColors[veh.commodity_type] || '#3B82F6';
      const isHighlighted = highlightedVehicle?.id === veh.id;

      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: ${isHighlighted ? '38px' : '32px'};
              height: ${isHighlighted ? '38px' : '32px'};
              background: ${color};
              border: ${isHighlighted ? '3px solid #ffffff' : '2px solid #0f172a'};
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              transform: rotate(${veh.heading_deg || 0}deg);
              transition: all 0.3s ease;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/>
                <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10Z"/>
                <circle cx="7" cy="18" r="2"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
            </div>
            ${veh.status === 'Delayed' ? `
              <span style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #EF4444; border: 2px solid white; border-radius: 50%;"></span>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([veh.current_lat, veh.current_long], { icon: vehicleIcon });

      marker.bindPopup(`
        <div style="min-width: 230px; font-family: inherit; color: #f8fafc;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #fff; font-size: 13px;">${veh.vehicle_number}</strong>
            <span style="background: ${color}20; color: ${color}; border: 1px solid ${color}50; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px;">
              ${veh.commodity_type}
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px;">
            <div>Driver: <strong style="color: #e2e8f0;">${veh.driver_name}</strong> (${veh.driver_phone || 'N/A'})</div>
            <div>Route: <span style="color: #e2e8f0;">${veh.origin_name} &rarr; ${veh.dest_name}</span></div>
            <div style="display: flex; justify-content: space-between;">
              <span>Speed: <strong style="color: #38bdf8;">${veh.speed_kmh} km/h</strong></span>
              <span>ETA: <strong style="color: ${veh.status === 'Delayed' ? '#f87171' : '#34d399'};">${veh.eta_minutes} mins</strong></span>
            </div>
            <div>Status: <strong style="color: ${veh.status === 'Moving' ? '#34d399' : veh.status === 'Delayed' ? '#f87171' : '#fbbf24'};">${veh.status}</strong></div>
            ${veh.delay_reason ? `<div style="color: #fca5a5; font-size: 10px; margin-top: 2px; background: rgba(239, 68, 68, 0.1); padding: 4px; border-radius: 4px;">⚠️ ${veh.delay_reason}</div>` : ''}
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectVehicle) onSelectVehicle(veh);
      });

      marker.addTo(vehiclesLayerRef.current);
    });
  }, [vehicles, showVehicles, highlightedVehicle, filterCommodity, onSelectVehicle]);

  // Render Incidents
  useEffect(() => {
    incidentsLayerRef.current.clearLayers();
    if (!showIncidents) return;

    incidents.forEach((inc) => {
      const typeIcons: Record<string, { bg: string; icon: string }> = {
        'Landslide': { bg: '#DC2626', icon: '⛰️' },
        'Flood': { bg: '#2563EB', icon: '🌊' },
        'Road Damage': { bg: '#D97706', icon: '🚧' },
        'Bridge Blocked': { bg: '#9333EA', icon: '🌉' },
        'Traffic Congestion': { bg: '#CA8A04', icon: '🚗' },
        'Other': { bg: '#4B5563', icon: '⚠️' }
      };
      const info = typeIcons[inc.type] || { bg: '#EF4444', icon: '⚠️' };
      const isResolved = inc.status === 'Resolved';

      const incidentIcon = L.divIcon({
        className: 'incident-marker-icon',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${isResolved ? '#059669' : info.bg};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            ${inc.severity === 'High' && !isResolved ? 'animation: marker-pulse 1.8s infinite;' : ''}
          ">
            ${isResolved ? '✓' : info.icon}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.lat, inc.long], { icon: incidentIcon });

      marker.bindPopup(`
        <div style="min-width: 240px; font-family: inherit; color: #f8fafc;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #fff; font-size: 13px;">${inc.type}</strong>
            <span style="background: ${inc.severity === 'High' ? '#ef4444' : inc.severity === 'Medium' ? '#f59e0b' : '#10b981'}20; color: ${inc.severity === 'High' ? '#f87171' : inc.severity === 'Medium' ? '#fbbf24' : '#34d399'}; border: 1px solid currentColor; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px;">
              ${inc.severity} Severity
            </span>
          </div>
          <p style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">${inc.description}</p>
          ${inc.photo_url ? `
            <div style="margin-bottom: 8px; border-radius: 6px; overflow: hidden; max-height: 110px;">
              <img src="${inc.photo_url}" alt="Incident ground photo" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          ` : ''}
          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 6px; display: flex; justify-content: space-between;">
            <span>Status: <strong style="color: ${inc.status === 'Resolved' ? '#34d399' : '#fbbf24'};">${inc.status}</strong></span>
            <span>Reported: ${new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectIncident) onSelectIncident(inc);
      });

      marker.addTo(incidentsLayerRef.current);
    });
  }, [incidents, showIncidents, onSelectIncident]);

  // Render Primary & Alternate AI Routes
  useEffect(() => {
    routesLayerRef.current.clearLayers();
    const map = mapInstanceRef.current;
    if (!map) return;

    if (primaryRoute && primaryRoute.path_coordinates.length > 1) {
      // Primary Route in Orange/Red if blocked, or Blue
      const isDangerous = primaryRoute.blocked_segments_count > 0 || primaryRoute.overall_risk_score > 0.5;
      const primaryLine = L.polyline(primaryRoute.path_coordinates, {
        color: isDangerous ? '#DC2626' : '#2563EB',
        weight: 6,
        opacity: 0.85,
        dashArray: isDangerous ? '8, 8' : undefined,
        lineCap: 'round'
      }).addTo(routesLayerRef.current);

      primaryLine.bindTooltip(`
        <div style="font-size: 11px;">
          <strong>${primaryRoute.route_name}</strong><br/>
          Distance: ${primaryRoute.total_distance_km} km | ETA: ${primaryRoute.estimated_time_minutes} min<br/>
          <span style="color: ${isDangerous ? '#DC2626' : '#059669'};">Risk: ${(primaryRoute.overall_risk_score * 100).toFixed(0)}% (${primaryRoute.risk_category})</span>
        </div>
      `, { sticky: true });
    }

    if (alternateRoute && alternateRoute.path_coordinates.length > 1) {
      // AI Recommended Alternate in Vivid Emerald/Teal
      const altLine = L.polyline(alternateRoute.path_coordinates, {
        color: '#0D9488',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round'
      }).addTo(routesLayerRef.current);

      altLine.bindTooltip(`
        <div style="font-size: 11px;">
          <strong style="color: #0D9488;">✨ ${alternateRoute.route_name}</strong><br/>
          Distance: ${alternateRoute.total_distance_km} km | ETA: ${alternateRoute.estimated_time_minutes} min<br/>
          Safe Bypass - Zero active blockages
        </div>
      `, { sticky: true });
    }

    // Zoom to fit routes if active
    if (primaryRoute || alternateRoute) {
      const allCoords = [
        ...(primaryRoute?.path_coordinates || []),
        ...(alternateRoute?.path_coordinates || [])
      ];
      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
      }
    }
  }, [primaryRoute, alternateRoute]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-slate-950" style={{ height }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls & HUD */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        {/* Layer Toggle Bar */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-xs text-slate-300">
          <button
            onClick={() => setShowRoads(!showRoads)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              showRoads ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Road Network"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Roads</span>
          </button>

          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              showVehicles ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Vehicles"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span>Fleet ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              showIncidents ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Incident Markers"
          >
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Hazards ({incidents.length})</span>
          </button>

          <button
            onClick={() => setShowDistricts(!showDistricts)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              showDistricts ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle District Boundaries"
          >
            <span className="h-2 w-2 rounded-full bg-purple-400"></span>
            <span>Districts</span>
          </button>
        </div>

        {/* Commodity filter pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[11px]">
          <span className="px-2 py-0.5 text-slate-400 font-semibold">Cargo:</span>
          {['all', 'Medicines', 'Food/PDS', 'Construction', 'Agricultural Produce'].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCommodity(c)}
              className={`px-2 py-0.5 rounded-md transition-all ${
                filterCommodity === c
                  ? 'bg-slate-700 text-teal-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c === 'all' ? 'All' : c.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-4 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded bg-emerald-500"></span>
          <span>Accessible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded bg-amber-500"></span>
          <span>Slow / Caution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded bg-red-500"></span>
          <span>Blocked / Closed</span>
        </div>
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
          <span className="h-2.5 w-5 rounded bg-teal-400"></span>
          <span>AI Safe Route</span>
        </div>
      </div>

      {/* Click-to-pick indicator if in interactive mode */}
      {interactivePicker && (
        <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-xs font-medium shadow-xl backdrop-blur-md animate-pulse">
          <Navigation className="h-3.5 w-3.5" />
          <span>Click anywhere on map to drop pin</span>
        </div>
      )}
    </div>
  );
};
