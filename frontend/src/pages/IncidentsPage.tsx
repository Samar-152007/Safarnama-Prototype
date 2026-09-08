import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Plus, Search, Filter, RefreshCw, Upload,
  MapPin, CheckCircle2, Clock, Camera, Image, ChevronRight, Eye
} from 'lucide-react';
import { Incident, District, Road, IncidentType, IncidentSeverity, IncidentStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LeafletMap } from '../components/map/LeafletMap';

export const IncidentsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'map'>('split');

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [inspectIncident, setInspectIncident] = useState<Incident | null>(null);

  // New incident form state
  const [formType, setFormType] = useState<IncidentType>('Landslide');
  const [formSeverity, setFormSeverity] = useState<IncidentSeverity>('Medium');
  const [formLat, setFormLat] = useState<number>(25.5788);
  const [formLong, setFormLong] = useState<number>(91.8933);
  const [formRoadName, setFormRoadName] = useState<string>('');
  const [formDistrictId, setFormDistrictId] = useState<number>(2);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isPickingCoords, setIsPickingCoords] = useState<boolean>(false);

  // Officer status update state
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus>('Open');
  const [officerNotes, setOfficerNotes] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [inc, d, r] = await Promise.all([
        api.incidents.getAll(),
        api.districts.getAll(),
        api.roads.getAll()
      ]);
      setIncidents(inc);
      setDistricts(d);
      setRoads(r);
      if (r.length > 0 && !formRoadName) {
        setFormRoadName(r[0].name);
      }
    } catch (err) {
      console.error('Error loading incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLat(pos.coords.latitude);
        setFormLong(pos.coords.longitude);
        setIsLocating(false);
      },
      () => {
        // Fallback default coordinates in Shillong/Guwahati
        setFormLat(25.5788);
        setFormLong(91.8933);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleMapClickCoordinate = (lat: number, lng: number) => {
    if (isPickingCoords || showReportModal) {
      setFormLat(Number(lat.toFixed(5)));
      setFormLong(Number(lng.toFixed(5)));
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription.trim()) return;

    setIsSubmitting(true);
    try {
      let photo_url = photoPreview || undefined;

      // If file uploaded, send to backend upload endpoint
      if (formPhoto) {
        try {
          const uploadRes = await api.incidents.uploadPhoto(formPhoto);
          photo_url = uploadRes.photo_url;
        } catch (uploadErr) {
          console.warn('Photo upload failed, proceeding with incident data:', uploadErr);
        }
      }

      const newInc = await api.incidents.create({
        type: formType,
        severity: formSeverity,
        lat: formLat,
        long: formLong,
        road_name: formRoadName,
        district_id: formDistrictId,
        description: formDescription,
        photo_url,
        reporter_name: user?.name || 'Field Patrol Unit'
      });

      setIncidents([newInc, ...incidents]);
      setShowReportModal(false);
      setFormDescription('');
      setFormPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error('Failed to submit incident:', err);
      alert('Failed to submit incident report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncidentStatus = async () => {
    if (!inspectIncident) return;
    try {
      const updated = await api.incidents.update(inspectIncident.id, {
        status: updateStatus,
        officer_notes: officerNotes
      });
      setIncidents(incidents.map(i => i.id === updated.id ? updated : i));
      setInspectIncident(updated);
    } catch (err) {
      console.error('Error updating incident status:', err);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.road_name && inc.road_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.reporter_name && inc.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || inc.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || inc.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || inc.severity === selectedSeverity;
    const matchesDistrict = selectedDistrict === 'all' || inc.district_id === selectedDistrict;
    return matchesSearch && matchesType && matchesStatus && matchesSeverity && matchesDistrict;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>Field Disruption & Incident Reporting</span>
            <span className="text-xs font-normal text-slate-400">({incidents.length} Ground Reports)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Report landslides, flash floods, and bridge blockages with live geotags and verification
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
              Table
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

          {/* Report Incident CTA Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Report Incident</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="md:col-span-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, highway..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Incident Types</option>
          <option value="Landslide">Landslide</option>
          <option value="Flood">Flash Flood / Inundation</option>
          <option value="Road Damage">Road / Pavement Damage</option>
          <option value="Bridge Blocked">Bridge Blocked / Structural</option>
          <option value="Traffic Congestion">Traffic Congestion</option>
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Severities</option>
          <option value="High">High Severity</option>
          <option value="Medium">Medium Severity</option>
          <option value="Low">Low Severity</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open (Action Needed)</option>
          <option value="In Progress">In Progress (Crews Deployed)</option>
          <option value="Resolved">Resolved (Passable)</option>
        </select>

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

      {/* Main Content Layout */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Table View */}
        {(viewMode === 'split' || viewMode === 'table') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'w-full'} rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl`}>
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Active Incidents ({filteredIncidents.length})
              </span>
              <span className="text-[11px] text-slate-400">Click row to review / update</span>
            </div>

            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="px-3 py-2.5">Type & Road</th>
                    <th className="px-3 py-2.5">Severity</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Reporter</th>
                    <th className="px-3 py-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No incidents matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc) => (
                      <tr
                        key={inc.id}
                        onClick={() => {
                          setInspectIncident(inc);
                          setUpdateStatus(inc.status);
                          setOfficerNotes(inc.officer_notes || '');
                        }}
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          inspectIncident?.id === inc.id ? 'bg-teal-500/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{inc.type}</span>
                            {inc.photo_url && <Image className="h-3 w-3 text-teal-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                            {inc.road_name || 'Regional Highway'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={inc.severity === 'High' ? 'danger' : inc.severity === 'Medium' ? 'warning' : 'info'}
                            size="sm"
                          >
                            {inc.severity}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inc.status === 'Resolved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : inc.status === 'In Progress'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-red-500/20 text-red-300 animate-pulse'
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                          {inc.reporter_name?.split(' ')[0] || 'Patrol'}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button className="p-1 rounded-lg text-teal-400 hover:bg-teal-500/20">
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
              roads={roads}
              incidents={filteredIncidents}
              districts={districts}
              onSelectIncident={(inc) => {
                setInspectIncident(inc);
                setUpdateStatus(inc.status);
                setOfficerNotes(inc.officer_notes || '');
              }}
              onMapClick={handleMapClickCoordinate}
              interactivePicker={isPickingCoords}
              pickerPosition={isPickingCoords ? [formLat, formLong] : null}
              height="660px"
            />
          </div>
        )}
      </div>

      {/* Report Incident Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Field Incident Report"
        subtitle="Submit real-time geo-tagged road obstruction data"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitIncident} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Incident Category</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as IncidentType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="Landslide">Landslide / Mudflow</option>
                <option value="Flood">Flash Flood / River Overflow</option>
                <option value="Road Damage">Road Subsidence / Cave-in</option>
                <option value="Bridge Blocked">Bridge Blocked / Structural Damage</option>
                <option value="Traffic Congestion">Traffic Congestion</option>
                <option value="Other">Other Obstruction</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Severity Level</label>
              <select
                value={formSeverity}
                onChange={(e) => setFormSeverity(e.target.value as IncidentSeverity)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="High">High (Road Impassable)</option>
                <option value="Medium">Medium (Single Lane / Slow)</option>
                <option value="Low">Low (Passable with Caution)</option>
              </select>
            </div>
          </div>

          {/* Highway & District */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Affected Highway / Road</label>
              <select
                value={formRoadName}
                onChange={(e) => setFormRoadName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {roads.map(r => (
                  <option key={r.id} value={r.name}>{r.code}: {r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">District</label>
              <select
                value={formDistrictId}
                onChange={(e) => setFormDistrictId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location GPS Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-medium">Coordinates (Latitude, Longitude)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoLocate}
                  className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{isLocating ? 'Locating...' : 'Auto-GPS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPickingCoords(!isPickingCoords)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPickingCoords ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Pick on Map
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.0001"
                value={formLat}
                onChange={(e) => setFormLat(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                placeholder="Latitude"
                required
              />
              <input
                type="number"
                step="0.0001"
                value={formLong}
                onChange={(e) => setFormLong(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                placeholder="Longitude"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Description of Hazard / Disruption</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Major mudslide 2km ahead of Sonapur tunnel. Boulders blocking both lanes. Excavator required."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              required
            ></textarea>
          </div>

          {/* Geotagged Photo Upload */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Ground Incident Photo (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-teal-500/50 hover:bg-slate-800/40 transition-colors">
                <Camera className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-slate-300 font-medium">Take photo or upload file</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>

              {photoPreview && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-1 right-1 bg-slate-900/80 rounded-full p-1 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Transmitting...' : 'Submit Ground Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Incident Review & Officer Action Modal */}
      <Modal
        isOpen={!!inspectIncident}
        onClose={() => setInspectIncident(null)}
        title={`Incident Case #${inspectIncident?.id}: ${inspectIncident?.type}`}
        subtitle="Verification & Officer Clearance Status"
      >
        {inspectIncident && (
          <div className="space-y-4 text-xs text-slate-300">
            {/* Photo preview if present */}
            {inspectIncident.photo_url && (
              <div className="rounded-xl overflow-hidden border border-slate-700 max-h-56">
                <img
                  src={inspectIncident.photo_url}
                  alt="Incident verification photo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{inspectIncident.road_name || 'Highway Corridor'}</span>
                <Badge
                  variant={inspectIncident.severity === 'High' ? 'danger' : inspectIncident.severity === 'Medium' ? 'warning' : 'info'}
                >
                  {inspectIncident.severity} Severity
                </Badge>
              </div>
              <p className="text-slate-300 text-xs mt-1">{inspectIncident.description}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                <span>Reporter: <strong className="text-slate-200">{inspectIncident.reporter_name}</strong></span>
                <span>Coordinates: <span className="font-mono">{inspectIncident.lat.toFixed(4)}°N, {inspectIncident.long.toFixed(4)}°E</span></span>
              </div>
            </div>

            {/* Officer Action / Status Update Form (Admins & District Officers) */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400" />
                <span>Officer Clearance & Status Update</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Update Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as IncidentStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="Open">Open (Pending Clearance)</option>
                  <option value="In Progress">In Progress (Crews & JCB on Site)</option>
                  <option value="Resolved">Resolved (Safe & Passable)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Officer Notes / Directives</label>
                <textarea
                  rows={2}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="e.g. NHAI earthmovers arrived. One lane cleared for relief convoy. Full restoration in 2 hours."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdateIncidentStatus}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold transition-colors"
                >
                  Save Status & Notes
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
