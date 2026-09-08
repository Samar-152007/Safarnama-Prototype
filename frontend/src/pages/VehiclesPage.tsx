import React, { useState, useEffect } from 'react';
import {
  Truck, Search, Filter, RefreshCw, Zap, Navigation, Clock,
  AlertTriangle, Phone, CheckCircle2, MapPin, Eye
} from 'lucide-react';
import { Vehicle, District } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { LeafletMap } from '../components/map/LeafletMap';
import { Modal } from '../components/common/Modal';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'map'>('split');

  // Selected vehicle inspection modal
  const [inspectVehicle, setInspectVehicle] = useState<Vehicle | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [v, d] = await Promise.all([
        api.vehicles.getAll(),
        api.districts.getAll()
      ]);
      setVehicles(v);
      setDistricts(d);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulateStep = async () => {
    setIsSimulating(true);
    try {
      const updated = await api.vehicles.simulateStep();
      setVehicles(updated);
      if (inspectVehicle) {
        const matching = updated.find(u => u.id === inspectVehicle.id);
        if (matching) setInspectVehicle(matching);
      }
    } catch (err) {
      console.error('Simulation step error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.origin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.dest_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCommodity = selectedCommodity === 'all' || v.commodity_type === selectedCommodity;
    const matchesStatus = selectedStatus === 'all' || v.status === selectedStatus;
    const matchesDistrict = selectedDistrict === 'all' || v.assigned_district_id === selectedDistrict;
    return matchesSearch && matchesCommodity && matchesStatus && matchesDistrict;
  });

  const commodityBadges: Record<string, 'info' | 'warning' | 'purple' | 'success'> = {
    'Medicines': 'info',
    'Food/PDS': 'warning',
    'Construction': 'purple',
    'Agricultural Produce': 'success'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-teal-400" />
            <span>Essential Supply Fleet Tracking</span>
            <span className="text-xs font-normal text-slate-400">({vehicles.length} Active Convoys)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitoring of life-saving medicines, food distribution, and emergency civil supplies
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'split' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'table' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roster
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'map' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Map
            </button>
          </div>

          {/* Simulate Movement Button */}
          <button
            onClick={handleSimulateStep}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Advance all active trucks along their routes"
          >
            <Zap className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Run GPS Tick</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        {/* Search box */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle number, driver, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Commodity Filter */}
        <select
          value={selectedCommodity}
          onChange={(e) => setSelectedCommodity(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Commodities</option>
          <option value="Medicines">Medicines & Vaccines</option>
          <option value="Food/PDS">Food / PDS Grains</option>
          <option value="Construction">Construction Materials</option>
          <option value="Agricultural Produce">Agricultural Produce</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Statuses</option>
          <option value="Moving">Moving (On Track)</option>
          <option value="Delayed">Delayed / Bottleneck</option>
          <option value="Stopped">Stopped / Depots</option>
        </select>

        {/* District Filter */}
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Districts</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Table View */}
        {(viewMode === 'split' || viewMode === 'table') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'w-full'} rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl`}>
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Tracked Fleet ({filteredVehicles.length})
              </span>
              <span className="text-[11px] text-slate-400">Showing North East active consignments</span>
            </div>

            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="px-3 py-2.5">Vehicle</th>
                    <th className="px-3 py-2.5">Cargo</th>
                    <th className="px-3 py-2.5">Route</th>
                    <th className="px-3 py-2.5">ETA</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No vehicles found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => (
                      <tr
                        key={v.id}
                        onClick={() => setInspectVehicle(v)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          inspectVehicle?.id === v.id ? 'bg-teal-500/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-white">{v.vehicle_number}</div>
                          <div className="text-[10px] text-slate-400">{v.driver_name}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={commodityBadges[v.commodity_type] || 'info'} size="sm">
                            {v.commodity_type.split('/')[0]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-slate-200 truncate max-w-[140px]">{v.dest_name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">From: {v.origin_name}</div>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-200">
                          {v.status === 'Stopped' ? 'At Depot' : `${v.eta_minutes}m`}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.status === 'Moving'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : v.status === 'Delayed'
                                ? 'bg-red-500/20 text-red-300 animate-pulse'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectVehicle(v);
                            }}
                            className="p-1 rounded-lg text-teal-400 hover:bg-teal-500/20 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'w-full'}`}>
            <LeafletMap
              vehicles={filteredVehicles}
              districts={districts}
              highlightedVehicle={inspectVehicle}
              onSelectVehicle={(veh) => setInspectVehicle(veh)}
              height="660px"
            />
          </div>
        )}
      </div>

      {/* Vehicle Inspection Detail Modal */}
      <Modal
        isOpen={!!inspectVehicle}
        onClose={() => setInspectVehicle(null)}
        title={`Convoy Inspection: ${inspectVehicle?.vehicle_number}`}
        subtitle="Real-time telemetry, driver status, and route obstruction audit"
      >
        {inspectVehicle && (
          <div className="space-y-4 text-xs text-slate-300">
            {/* Top overview banner */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-white">{inspectVehicle.vehicle_number}</div>
                <div className="text-slate-400">Driver: {inspectVehicle.driver_name}</div>
              </div>
              <div className="text-right">
                <Badge variant={commodityBadges[inspectVehicle.commodity_type] || 'info'}>
                  {inspectVehicle.commodity_type}
                </Badge>
                <div className="text-[10px] text-slate-400 mt-1">
                  Speed: <strong className="text-teal-400">{inspectVehicle.speed_kmh} km/h</strong>
                </div>
              </div>
            </div>

            {/* Delay alert banner if delayed */}
            {inspectVehicle.status === 'Delayed' && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <div className="font-bold text-red-200">Delivery Delay Warning</div>
                  <div className="text-[11px] mt-0.5">{inspectVehicle.delay_reason || 'Corridor bottleneck on mountain pass'}</div>
                </div>
              </div>
            )}

            {/* Route Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Origin Hub</span>
                <p className="font-semibold text-slate-100 mt-1">{inspectVehicle.origin_name}</p>
                <span className="text-[10px] text-teal-400 mt-0.5 block">Dispatched on schedule</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Destination</span>
                <p className="font-semibold text-slate-100 mt-1">{inspectVehicle.dest_name}</p>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">ETA: {inspectVehicle.eta_minutes} mins</span>
              </div>
            </div>

            {/* Telemetry Details */}
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Current GPS Coords:</span>
                <span className="font-mono text-slate-200">{inspectVehicle.current_lat.toFixed(4)}°N, {inspectVehicle.current_long.toFixed(4)}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Contact:</span>
                <span className="text-teal-400 font-semibold">{inspectVehicle.driver_phone || '+91 94350 12345'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Telemetry Ping:</span>
                <span className="text-slate-300">{new Date(inspectVehicle.last_update_time).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectVehicle(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
