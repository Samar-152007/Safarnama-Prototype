import React, { useState, useEffect } from 'react';
import {
  BarChart3, PieChart, TrendingUp, ShieldAlert, Download, RefreshCw,
  Truck, AlertTriangle, CheckCircle2, Filter
} from 'lucide-react';
import { AnalyticsSummary, District } from '../types';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<number | 'all'>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dId = selectedDistrict === 'all' ? undefined : selectedDistrict;
      const [s, d] = await Promise.all([
        api.analytics.getSummary(dId),
        api.districts.getAll()
      ]);
      setSummary(s);
      setDistricts(d);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDistrict]);

  const handleExportCSV = () => {
    if (!summary) return;
    const headers = 'Highway,Code,District,RiskScore,Rainfall_mm,Slope_deg,Status\n';
    const rows = summary.high_risk_corridors.map(c => 
      `"${c.name}","${c.code}","${c.district}",${c.risk_score},${c.rainfall_mm},${c.slope_deg},"${c.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safarnama_risk_analytics_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  if (!summary) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-teal-400 mb-2" />
        <span>Aggregating regional logistics intelligence...</span>
      </div>
    );
  }

  const kpis = summary.kpis;
  const maxIncidents = Math.max(...summary.district_incidents.map(d => d.incident_count), 1);
  const totalIncidents = summary.incident_types.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-teal-400" />
            <span>Accessibility & Logistics Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quarterly logistics resilience, hazard impact distribution, and supply convoy punctuality metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="h-4 w-4" />
          <span>Scope Filter:</span>
        </div>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="all">All North East Districts (National View)</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-teal-500"
        >
          <option value="7d">Last 7 Days (Monsoon Surge)</option>
          <option value="30d">Last 30 Days (Standard)</option>
          <option value="90d">Quarterly Retrospective</option>
        </select>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          title="Corridor Uptime"
          value={`${kpis.accessibility_index}%`}
          subtitle={`${kpis.closed_roads} closures in network`}
          icon={TrendingUp}
          variant="teal"
        />
        <StatCard
          title="Active Convoys"
          value={kpis.total_vehicles}
          subtitle={`${kpis.moving_vehicles} moving, ${kpis.delayed_vehicles} delayed`}
          icon={Truck}
          variant="blue"
        />
        <StatCard
          title="Total Ground Hazards"
          value={kpis.open_incidents}
          subtitle="Landslides & washouts logged"
          icon={AlertTriangle}
          variant="amber"
        />
        <StatCard
          title="Resolved Alerts"
          value={kpis.active_alerts}
          subtitle="Proactive system mitigations"
          icon={CheckCircle2}
          variant="purple"
        />
      </div>

      {/* Chart Grid: District Breakdown & Incident Types */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* District-wise Incidents Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              District Hazard Vulnerability Index
            </h3>
            <span className="text-[11px] text-slate-400">Total Incidents per District</span>
          </div>

          <div className="space-y-3.5">
            {summary.district_incidents.map((d) => {
              const pct = Math.round((d.incident_count / maxIncidents) * 100);
              return (
                <div key={d.district_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {d.district_name} <span className="text-[10px] text-slate-400">({d.state})</span>
                    </span>
                    <span className="font-bold text-teal-400">{d.incident_count} reports</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Types Distribution Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Incident Category Breakdown
            </h3>
            <span className="text-[11px] text-slate-400">Distribution %</span>
          </div>

          <div className="space-y-3">
            {summary.incident_types.map((t) => {
              const share = totalIncidents > 0 ? Math.round((t.count / totalIncidents) * 100) : 0;
              const colors: Record<string, string> = {
                'Landslide': 'bg-red-500',
                'Flood': 'bg-blue-500',
                'Road Damage': 'bg-amber-500',
                'Bridge Blocked': 'bg-purple-500',
                'Traffic Congestion': 'bg-yellow-500',
              };
              const bg = colors[t.type] || 'bg-teal-500';

              return (
                <div key={t.type} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${bg}`}></span>
                      <span className="font-medium text-slate-200">{t.type}</span>
                    </div>
                    <span className="font-bold text-slate-100">{t.count} ({share}%)</span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full ${bg} rounded-full`} style={{ width: `${share}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Risk Corridors Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              High-Risk Corridors Priority Ranking (AI Hazard Assessment)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Monitored for landslide & structural washouts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3">Highway Segment</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">AI Risk Score</th>
                <th className="px-4 py-3">24h Rain</th>
                <th className="px-4 py-3">Slope Gradient</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {summary.high_risk_corridors.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">
                    {c.code}: {c.name}
                    {c.bridge_present && <span className="ml-2 text-[10px] text-sky-400">🌉 Bridge</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{c.district}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${c.risk_score >= 0.7 ? 'text-red-400' : 'text-amber-400'}`}>
                      {(c.risk_score * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sky-400 font-mono">{c.rainfall_mm} mm</td>
                  <td className="px-4 py-3 font-mono">{c.slope_deg}°</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.condition === 'Good' ? 'success' : c.condition === 'Fair' ? 'warning' : 'danger'} size="sm">
                      {c.condition}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Open' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
