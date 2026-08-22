// BatteryX AI – API Service Layer
import axios from 'axios';
import type {
  Battery, BatteryReading, AnalysisResponse, LatestAnalysis,
  Certificate, VerifyResponse, DashboardStats, User
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Inject token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bx_token');
      localStorage.removeItem('bx_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, full_name: string, organization_name?: string) => {
    const res = await api.post('/auth/register', { email, password, full_name, organization_name });
    return res.data;
  },
};

// ---- Batteries ----
export const batteryApi = {
  list: async (search?: string, chemistry?: string, risk?: string) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (chemistry) params.chemistry = chemistry;
    if (risk) params.risk = risk;
    const res = await api.get<Battery[]>('/batteries', { params });
    return res.data;
  },
  get: async (batteryId: string) => {
    const res = await api.get<Battery>(`/batteries/${batteryId}`);
    return res.data;
  },
  create: async (data: Partial<Battery>) => {
    const res = await api.post('/batteries', data);
    return res.data;
  },
  update: async (batteryId: string, data: Partial<Battery>) => {
    const res = await api.put(`/batteries/${batteryId}`, data);
    return res.data;
  },
  uploadTelemetry: async (batteryId: string, reading: Partial<BatteryReading>) => {
    const res = await api.post(`/batteries/${batteryId}/telemetry`, reading);
    return res.data;
  },
  uploadCsv: async (batteryId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/batteries/${batteryId}/upload-csv`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getReadings: async (batteryId: string) => {
    const res = await api.get<BatteryReading[]>(`/batteries/${batteryId}/readings`);
    return res.data;
  },
};

// ---- Analysis ----
export const analysisApi = {
  run: async (batteryId: string, data: {
    voltage_v: number;
    current_a: number;
    temperature_c: number;
    soc_pct: number;
    internal_resistance_mohm: number;
    measured_capacity_ah?: number;
  }) => {
    const res = await api.post<AnalysisResponse>(`/analysis/${batteryId}`, data);
    return res.data;
  },
  getLatest: async (batteryId: string) => {
    const res = await api.get<LatestAnalysis>(`/analysis/${batteryId}/latest`);
    return res.data;
  },
};

// ---- Certificates ----
export const certificateApi = {
  generate: async (batteryId: string) => {
    const res = await api.post<Certificate>(`/certificates/${batteryId}`);
    return res.data;
  },
  get: async (certificateId: string) => {
    const res = await api.get<Certificate>(`/certificates/${certificateId}`);
    return res.data;
  },
  downloadPdf: async (certificateId: string) => {
    const res = await api.get(`/certificates/${certificateId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BatteryX-Certificate-${certificateId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  getQrUrl: (certificateId: string) => `/api/v1/certificates/${certificateId}/qr`,
  verify: async (certificateId: string) => {
    const res = await api.get<VerifyResponse>(`/certificates/verify/${certificateId}`);
    return res.data;
  },
};

// ---- Dashboard ----
export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};

// ---- Admin ----
export const adminApi = {
  getUsers: async () => {
    const res = await api.get<User[]>('/admin/users');
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/admin/me');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data;
  },
};

export default api;
