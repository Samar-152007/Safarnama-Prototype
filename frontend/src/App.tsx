import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopNavbar } from './components/layout/TopNavbar';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { RoutePlannerPage } from './pages/RoutePlannerPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavItem>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] flex flex-col items-center justify-center text-slate-300">
        <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-semibold tracking-wider uppercase text-teal-400">
          Loading Safarnama Intelligence Grid...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <TopNavbar onOpenAlerts={() => setActiveTab('alerts')} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Center Page View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'vehicles' && <VehiclesPage />}
          {activeTab === 'incidents' && <IncidentsPage />}
          {activeTab === 'routes' && <RoutePlannerPage />}
          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
