import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, ShieldAlert, CloudRain, Clock, CheckCircle2,
  Filter, Search, RefreshCw, Zap, ExternalLink, ArrowRight
} from 'lucide-react';
import { Alert, District } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const AlertsPage: React.FC = () => {
  const { setUnreadAlertsCount } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [filterResolved, setFilterResolved] = useState<string>('unresolved');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const isResolvedParam = filterResolved === 'all' ? undefined : filterResolved === 'resolved';
      const [a, d] = await Promise.all([
        api.alerts.getAll({ is_resolved: isResolvedParam }),
        api.districts.getAll()
      ]);
      setAlerts(a);
      setDistricts(d);
      setUnreadAlertsCount(a.filter(item => !item.is_resolved).length);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterResolved]);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.alerts.triggerRuleScan();
      setScanMessage(res.message);
      loadAlerts();
    } catch (err) {
      console.error('Error triggering rule engine scan:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      const resolved = await api.alerts.resolve(id);
      setAlerts(alerts.map(a => a.id === id ? resolved : a));
      setUnreadAlertsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.district_name && a.district_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || a.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || a.severity === selectedSeverity;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const alertIcons: Record<string, React.FC<{ className?: string }>> = {
    'BlockedRoad': AlertTriangle,
    'HighRiskCorridor': ShieldAlert,
    'DelayedDelivery': Clock,
    'WeatherWarning': CloudRain
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-400" />
            <span>Automated Incident & Critical Corridor Alerts</span>
            <span className="text-xs font-normal text-slate-400">({alerts.length} Records)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated backend rule engine auditing road blockages, landslide thresholds, and delivery delays
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Rule Engine Scan Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
            title="Scan database for new highway disruptions, rainfall thresholds, and delivery delays"
          >
            <Zap className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Grid...' : 'Run Rule Engine Audit'}</span>
          </button>

          <button
            onClick={loadAlerts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rule engine result banner */}
      {scanMessage && (
        <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-200 text-xs flex items-center justify-between animate-in fade-in">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">×</button>
        </div>
      )}

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
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
          <option value="all">All Alert Types</option>
          <option value="BlockedRoad">Blocked Roads</option>
          <option value="HighRiskCorridor">High Risk Corridors</option>
          <option value="DelayedDelivery">Delayed Deliveries</option>
          <option value="WeatherWarning">Weather Warnings</option>
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="unresolved">Active Alerts Only</option>
          <option value="resolved">Resolved Alerts</option>
          <option value="all">All History</option>
        </select>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400 text-xs">
            No alerts found matching current filters. All corridors operating within nominal thresholds.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = alertIcons[alert.type] || AlertTriangle;
            const isResolved = alert.is_resolved;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all shadow-lg backdrop-blur-sm ${
                  isResolved
                    ? 'bg-slate-900/40 border-slate-800 opacity-70'
                    : alert.severity === 'Critical'
                    ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        isResolved
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : alert.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : alert.type === 'WeatherWarning'
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-bold ${isResolved ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {alert.title}
                        </h3>
                        <Badge
                          variant={
                            alert.severity === 'Critical'
                              ? 'danger'
                              : alert.severity === 'High'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                        >
                          {alert.severity}
                        </Badge>
                        {isResolved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Resolved
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                        {alert.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2.5">
                        {alert.district_name && (
                          <span>District: <strong className="text-slate-300">{alert.district_name}</strong></span>
                        )}
                        {alert.road_name && (
                          <span>Corridor: <strong className="text-slate-300">{alert.road_name}</strong></span>
                        )}
                        {alert.vehicle_number && (
                          <span>Vehicle: <strong className="text-cyan-300">{alert.vehicle_number}</strong></span>
                        )}
                        <span>Triggered: {new Date(alert.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolve Button */}
                  {!isResolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-semibold transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Acknowledge & Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
