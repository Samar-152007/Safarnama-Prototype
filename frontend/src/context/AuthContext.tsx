import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

export type Language = 'en' | 'hi' | 'as' | 'bn';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (targetRole: UserRole) => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => void;
  unreadAlertsCount: number;
  setUnreadAlertsCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('en');
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(3);

  const fetchCurrentUser = async () => {
    try {
      const me = await api.auth.getMe();
      setUser(me);
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
      // Fallback default admin profile for offline demo
      setUser({
        id: 1,
        name: 'Dr. Rajesh Sharma (Director General)',
        email: 'admin@safarnama.gov.in',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    // Fetch active alert count
    api.alerts.getAll({ is_resolved: false })
      .then(alerts => setUnreadAlertsCount(alerts.length))
      .catch(() => {});
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const quickSwitchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const credentialsMap = {
        admin: { email: 'admin@safarnama.gov.in', pass: 'admin123' },
        officer: { email: 'officer@safarnama.gov.in', pass: 'officer123' },
        field_user: { email: 'field@safarnama.gov.in', pass: 'field123' }
      };
      const { email, pass } = credentialsMap[targetRole];
      const res = await api.auth.login(email, pass);
      setUser(res.user);
    } catch (err) {
      console.error('Quick switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'admin',
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        quickSwitchRole,
        language,
        setLanguage,
        unreadAlertsCount,
        setUnreadAlertsCount,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
