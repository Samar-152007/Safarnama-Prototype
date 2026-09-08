import React, { useState } from 'react';
import {
  ShieldAlert, Bell, Globe, UserCheck, LogOut, ChevronDown, CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import { useAuth, Language } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface TopNavbarProps {
  onOpenAlerts?: () => void;
  activeAlertsCount?: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenAlerts, activeAlertsCount = 0 }) => {
  const { user, role, logout, quickSwitchRole, language, setLanguage, unreadAlertsCount } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(true);

  const roleLabels: Record<UserRole, { title: string; desc: string; color: string }> = {
    admin: {
      title: 'Administrator',
      desc: 'National & Regional Oversight (All Districts)',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    officer: {
      title: 'District Officer',
      desc: 'East Khasi Hills (Approvals & Analytics)',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    field_user: {
      title: 'Field Reporter',
      desc: 'Cachar / Silchar (Field Reports & Photo GPS)',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    }
  };

  const languageLabels: Record<Language, string> = {
    en: 'English (EN)',
    hi: 'हिंदी (Hindi)',
    as: 'অসমীয়া (Assamese)',
    bn: 'বাংলা (Bengali)'
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 shadow-lg shadow-teal-500/20">
            <span className="text-xl font-black tracking-tighter">स</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Safarnama</h1>
              <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20">
                NER-AI 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Every Journey Safe, Every Route Smart
            </p>
          </div>
        </div>

        {/* Center/Right controls */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-all"
              title="Switch role to test permissions"
            >
              <UserCheck className="h-3.5 w-3.5 text-teal-400" />
              <span className="hidden md:inline text-slate-400">Role:</span>
              <span className="font-semibold text-teal-300">{roleLabels[role]?.title}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-800 border border-slate-700 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  Switch Active Role (Demo Mode)
                </div>
                {(['admin', 'officer', 'field_user'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      quickSwitchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex flex-col gap-0.5 transition-colors ${
                      role === r ? 'bg-teal-500/20 text-teal-200 border border-teal-500/30' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{roleLabels[r].title}</span>
                      {role === r && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400">{roleLabels[r].desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 border border-slate-700 hover:bg-slate-700/80 transition-all"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden lg:inline">{languageLabels[language]}</span>
              <span className="lg:hidden uppercase">{language}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-800 border border-slate-700 p-1.5 shadow-2xl z-50">
                {(['en', 'hi', 'as', 'bn'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                      language === l ? 'bg-teal-500/20 text-teal-200 font-semibold' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {languageLabels[l]}
                    {language === l && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all"
            title="View Active Critical Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                {user?.name || 'Officer'}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
