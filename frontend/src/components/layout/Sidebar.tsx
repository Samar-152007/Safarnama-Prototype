import React from 'react';
import {
  LayoutDashboard, Truck, AlertTriangle, Route, Bell, BarChart3, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItem = 'dashboard' | 'vehicles' | 'incidents' | 'routes' | 'alerts' | 'analytics' | 'settings';

interface SidebarProps {
  activeTab: NavItem;
  onTabChange: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { logout, unreadAlertsCount, role } = useAuth();

  const navItems: { id: NavItem; label: string; icon: React.FC<{ className?: string }>; badge?: number; officerOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'routes', label: 'AI Route Planner', icon: Route },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlertsCount },
    { id: 'analytics', label: 'Reports / Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4 px-2 md:px-4 space-y-1">
        <div className="hidden md:block px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Platform Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title={item.label}
            >
              <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline truncate">{item.label}</span>

              {item.badge && item.badge > 0 ? (
                <span className="ml-auto hidden md:flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {item.badge}
                </span>
              ) : null}

              {/* Mobile notification dot */}
              {item.badge && item.badge > 0 ? (
                <span className="md:hidden absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Session Footer */}
      <div className="p-2 md:p-4 border-t border-slate-800/80">
        <div className="hidden md:block mb-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between font-medium text-slate-300 mb-0.5">
            <span>Disaster Grid</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <span className="text-slate-400">NER Nodes Online</span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Sign out of Safarnama"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
