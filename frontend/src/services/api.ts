import {
  User, District, Road, Vehicle, Incident, Alert,
  RouteSuggestResponse, AnalyticsSummary
} from '../types';

const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('safarnama_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Authentication
  auth: {
    login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
      const res = await request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('safarnama_token', res.access_token);
      return res;
    },
    getMe: async (): Promise<User> => {
      return request<User>('/auth/me');
    },
    logout: () => {
      localStorage.removeItem('safarnama_token');
    }
  },

  // Users
  users: {
    getAll: (): Promise<User[]> => request<User[]>('/users'),
    create: (data: Partial<User> & { password: string }): Promise<User> =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<User>): Promise<User> =>
      request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateProfile: (data: Partial<User>): Promise<User> =>
      request<User>('/users/me', { method: 'PUT', body: JSON.stringify(data) })
  },

  // Districts
  districts: {
    getAll: (): Promise<District[]> => request<District[]>('/districts'),
    getById: (id: number): Promise<District> => request<District>(`/districts/${id}`)
  },

  // Roads
  roads: {
    getAll: (params?: { district_id?: number; status?: string; condition?: string; min_risk?: number; is_emergency?: boolean }): Promise<Road[]> => {
      const query = new URLSearchParams();
      if (params?.district_id) query.append('district_id', params.district_id.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.condition) query.append('condition', params.condition);
      if (params?.min_risk !== undefined) query.append('min_risk', params.min_risk.toString());
      if (params?.is_emergency !== undefined) query.append('is_emergency', params.is_emergency.toString());
      return request<Road[]>(`/roads?${query.toString()}`);
    },
    update: (id: number, data: { status?: string; condition?: string; avg_rainfall_mm?: number }): Promise<Road> =>
      request<Road>(`/roads/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Vehicles
  vehicles: {
    getAll: (params?: { district_id?: number; status?: string; commodity_type?: string }): Promise<Vehicle[]> => {
      const query = new URLSearchParams();
      if (params?.district_id) query.append('district_id', params.district_id.toString());
      if (params?.status) query.append('status', params.status);
      if (params?.commodity_type) query.append('commodity_type', params.commodity_type);
      return request<Vehicle[]>(`/vehicles?${query.toString()}`);
    },
    simulateStep: (): Promise<Vehicle[]> =>
      request<Vehicle[]>('/vehicles/simulate-step', { method: 'POST' }),
    updateLocation: (id: number, data: Partial<Vehicle>): Promise<Vehicle> =>
      request<Vehicle>(`/vehicles/${id}/location`, { method: 'POST', body: JSON.stringify(data) })
  },

  // Incidents
  incidents: {
    getAll: (params?: { district_id?: number; type?: string; status?: string; severity?: string }): Promise<Incident[]> => {
      const query = new URLSearchParams();
      if (params?.district_id) query.append('district_id', params.district_id.toString());
      if (params?.type) query.append('type', params.type);
      if (params?.status) query.append('status', params.status);
      if (params?.severity) query.append('severity', params.severity);
      return request<Incident[]>(`/incidents?${query.toString()}`);
    },
    create: (data: Partial<Incident>): Promise<Incident> =>
      request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { status?: string; severity?: string; officer_notes?: string }): Promise<Incident> =>
      request<Incident>(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadPhoto: async (file: File): Promise<{ photo_url: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      const headers = getAuthHeader();
      const res = await fetch(`${BASE_URL}/incidents/upload-photo`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (!res.ok) throw new Error('Photo upload failed');
      return res.json();
    }
  },

  // Alerts
  alerts: {
    getAll: (params?: { district_id?: number; type?: string; is_resolved?: boolean }): Promise<Alert[]> => {
      const query = new URLSearchParams();
      if (params?.district_id) query.append('district_id', params.district_id.toString());
      if (params?.type) query.append('type', params.type);
      if (params?.is_resolved !== undefined) query.append('is_resolved', params.is_resolved.toString());
      return request<Alert[]>(`/alerts?${query.toString()}`);
    },
    resolve: (id: number): Promise<Alert> =>
      request<Alert>(`/alerts/${id}/resolve`, { method: 'PUT' }),
    triggerRuleScan: (): Promise<{ message: string; new_alerts: number }> =>
      request<{ message: string; new_alerts: number }>('/alerts/scan-rules', { method: 'POST' })
  },

  // AI Routes & Hazard Risk
  routes: {
    suggest: (data: {
      origin_lat: number;
      origin_long: number;
      origin_name?: string;
      dest_lat: number;
      dest_long: number;
      dest_name?: string;
      vehicle_type?: string;
      cargo_sensitivity?: string;
    }): Promise<RouteSuggestResponse> =>
      request<RouteSuggestResponse>('/routes/suggest', { method: 'POST', body: JSON.stringify(data) }),
    getRiskSegments: (districtId?: number): Promise<any[]> =>
      request<any[]>(`/risk/segments${districtId ? `?district_id=${districtId}` : ''}`)
  },

  // Analytics
  analytics: {
    getSummary: (districtId?: number): Promise<AnalyticsSummary> =>
      request<AnalyticsSummary>(`/analytics/summary${districtId ? `?district_id=${districtId}` : ''}`)
  }
};
