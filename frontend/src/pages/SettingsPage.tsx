import React, { useState, useEffect } from 'react';
import {
  Settings, User, Lock, Globe, Shield, UserPlus, CheckCircle2,
  RefreshCw, Edit2, Ban, Check
} from 'lucide-react';
import { useAuth, Language } from '../context/AuthContext';
import { User as UserType, District, UserRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { user, role, language, setLanguage, refreshUserData } = useAuth();

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileDistrictId, setProfileDistrictId] = useState<number | undefined>(user?.district_id);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Admin User Management state
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('officer');
  const [newUserDistrictId, setNewUserDistrictId] = useState<number>(2);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      setProfileDistrictId(user.district_id);
    }
    api.districts.getAll().then(setDistricts);
    if (role === 'admin') {
      api.users.getAll().then(setAllUsers).catch(() => {});
    }
  }, [user, role]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    try {
      await api.users.updateProfile({
        name: profileName,
        phone: profilePhone,
        district_id: profileDistrictId,
        password: profilePassword || undefined
      });
      await refreshUserData();
      setProfileSuccessMsg('Profile updated successfully.');
      setProfilePassword('');
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.users.create({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        district_id: newUserDistrictId,
        is_active: true
      });
      setAllUsers([...allUsers, created]);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err) {
      console.error('Error creating user:', err);
      alert('Failed to create user. Email may already exist.');
    }
  };

  const handleToggleUserActive = async (targetUser: UserType) => {
    try {
      const updated = await api.users.update(targetUser.id, {
        is_active: !targetUser.is_active
      });
      setAllUsers(allUsers.map(u => u.id === updated.id ? updated : u));
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  ];

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-teal-400" />
          <span>System Settings & Profile Administration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure personal credentials, linguistic preferences, and officer administrative assignments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* User Profile Form */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Personal Profile
            </h3>
          </div>

          {profileSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Official Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+91 98640 12345"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Assigned Operational District</label>
              <select
                value={profileDistrictId || ''}
                onChange={(e) => setProfileDistrictId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="">National / Regional Floating</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">New Password (leave blank to keep current)</label>
              <input
                type="password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs transition-colors"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Language & Regional Localization */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="h-4 w-4 text-teal-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Language & Regional Localization
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Select your preferred operating language for alerts, field reporting, and dispatch communications.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  language === l.code
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-200 font-bold shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-semibold">{l.native}</div>
                <div className="text-[11px] text-slate-400">{l.label}</div>
              </button>
            ))}
          </div>

          {/* Regional Information */}
          <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-200">North Eastern Council (NEC) Grid</div>
            <p className="text-slate-400 text-[11px]">
              Platform synchronized with Shillong Central Command & Guwahati Hub. PostGIS spatial layers updated hourly.
            </p>
          </div>
        </div>
      </div>

      {/* Admin User Management Section (Only visible to Admin) */}
      {role === 'admin' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                User Management & Role Access (Administrator Control)
              </h3>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add System User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">District</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-semibold text-white">{u.name}</td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">{u.email}</td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={u.role === 'admin' ? 'purple' : u.role === 'officer' ? 'info' : 'slate'}
                        size="sm"
                      >
                        {u.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {districts.find(d => d.id === u.district_id)?.name || 'All Districts'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleUserActive(u)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            u.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Add System Official / User"
        subtitle="Provision access credentials and district operational scope"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Inspector R. Sangma"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="official@safarnama.gov.in"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Temporary Password</label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Access Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="officer">District Officer</option>
                <option value="field_user">Field User / Logistics</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Assigned District</label>
              <select
                value={newUserDistrictId}
                onChange={(e) => setNewUserDistrictId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Provision User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
