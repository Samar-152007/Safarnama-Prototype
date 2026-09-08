import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, quickSwitchRole, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your official login details.');
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setErrorMsg(null);
    try {
      await quickSwitchRole(role);
    } catch (err: any) {
      setErrorMsg('Failed to log in with preset account.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 shadow-2xl shadow-teal-500/30 mb-2">
            <span className="text-3xl font-black tracking-tighter">स</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Safarnama</h1>
          <p className="text-xs font-semibold tracking-wide text-teal-400 uppercase">
            Every Journey Safe, Every Route Smart
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            AI-Powered Smart Logistics & Accessibility Intelligence Platform for India
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Official Email ID</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@safarnama.gov.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Quick Demo Roles</span>
              <span className="text-teal-400">Instant Access</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 text-slate-200 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="group-hover:text-purple-300">1. Administrator (All Districts)</span>
                  <span className="text-[10px] text-purple-400 font-mono">admin@safarnama.gov.in</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">National oversight, manage users, full GIS network</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('officer')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-slate-200 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="group-hover:text-emerald-300">2. District Officer (East Khasi Hills)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">officer@safarnama.gov.in</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Approve incidents, analytics, emergency clearances</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('field_user')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-slate-200 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="group-hover:text-cyan-300">3. Field User / Logistics (Cachar / Silchar)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">field@safarnama.gov.in</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Report hazards with GPS & photos, view local routes</p>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Deployment Note */}
        <div className="text-center text-[11px] text-slate-500">
          Government of India & North Eastern Council (NEC) Geospatial Infrastructure
        </div>
      </div>
    </div>
  );
};
