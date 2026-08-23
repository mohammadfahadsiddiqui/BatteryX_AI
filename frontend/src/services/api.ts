// BatteryX AI – Complete API Service Layer (v3.0)
import axios from 'axios';
import type {
  Battery, BatteryReading, AnalysisResponse, LatestAnalysis,
  Certificate, VerifyResponse, DashboardStats, User,
  HardwareDevice, DeviceEvent, LiveTelemetry,
  DiagnosticSession, BatteryAlert, BatteryLifecycleEvent,
  FleetVehicle, BMSDevice,
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

// ── Auth ──────────────────────────────────────────────────────────────────────
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

// ── Batteries ─────────────────────────────────────────────────────────────────
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

// ── Analysis ──────────────────────────────────────────────────────────────────
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

// ── Certificates ──────────────────────────────────────────────────────────────
export const certificateApi = {
  generate: async (batteryId: string) => {
    const res = await api.post<Certificate>(`/certificates/${batteryId}`);
    return res.data;
  },
  list: async (params?: Record<string, string>) => {
    const res = await api.get<Certificate[]>('/certificates', { params });
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────
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

// ── Hardware Devices ──────────────────────────────────────────────────────────
export const hardwareApi = {
  list: async (device_type?: string, status?: string) => {
    const params: Record<string, string> = {};
    if (device_type) params.device_type = device_type;
    if (status) params.status = status;
    const res = await api.get<HardwareDevice[]>('/hardware/devices', { params });
    return res.data;
  },
  get: async (deviceId: string) => {
    const res = await api.get<HardwareDevice>(`/hardware/devices/${deviceId}`);
    return res.data;
  },
  register: async (data: {
    device_id: string;
    name: string;
    device_type?: string;
    connection_type?: string;
    firmware_version?: string;
    notes?: string;
  }) => {
    const res = await api.post('/hardware/devices/register', data);
    return res.data;
  },
  update: async (deviceId: string, data: Partial<HardwareDevice>) => {
    const res = await api.put(`/hardware/devices/${deviceId}`, data);
    return res.data;
  },
  assign: async (deviceId: string, battery_id: string) => {
    const res = await api.post(`/hardware/devices/${deviceId}/assign`, { battery_id });
    return res.data;
  },
  deactivate: async (deviceId: string) => {
    const res = await api.post(`/hardware/devices/${deviceId}/deactivate`);
    return res.data;
  },
  getStatus: async (deviceId: string) => {
    const res = await api.get(`/hardware/devices/${deviceId}/status`);
    return res.data;
  },
  getEvents: async (deviceId: string) => {
    const res = await api.get<DeviceEvent[]>(`/hardware/devices/${deviceId}/events`);
    return res.data;
  },
};

// ── Telemetry ─────────────────────────────────────────────────────────────────
export const telemetryApi = {
  getLatest: async (batteryId: string) => {
    const res = await api.get<LiveTelemetry>(`/telemetry/${batteryId}/latest`);
    return res.data;
  },
  getHistory: async (batteryId: string, limit = 200, source?: string) => {
    const params: Record<string, string | number> = { limit };
    if (source) params.source = source;
    const res = await api.get<LiveTelemetry[]>(`/telemetry/${batteryId}/history`, { params });
    return res.data;
  },
  ingest: async (packet: Partial<LiveTelemetry>) => {
    const res = await api.post('/telemetry', packet);
    return res.data;
  },
};

// ── Demo ──────────────────────────────────────────────────────────────────────
export const demoApi = {
  getScenarios: async () => {
    const res = await api.get('/demo/scenarios');
    return res.data as Array<{ key: string; label: string }>;
  },
  getTelemetry: async (batteryId: string, scenario = 'healthy', tick = 0) => {
    const res = await api.get(`/demo/telemetry/${batteryId}`, { params: { scenario, tick } });
    return res.data as LiveTelemetry;
  },
};

// ── Diagnostics ───────────────────────────────────────────────────────────────
export const diagnosticApi = {
  list: async (params?: { battery_id?: string; status?: string; data_source?: string }) => {
    const res = await api.get<DiagnosticSession[]>('/diagnostics', { params });
    return res.data;
  },
  get: async (sessionId: string) => {
    const res = await api.get<DiagnosticSession>(`/diagnostics/${sessionId}`);
    return res.data;
  },
  create: async (data: {
    battery_id: string;
    diagnostic_type?: string;
    data_source?: string;
    device_id?: string;
    notes?: string;
  }) => {
    const res = await api.post<DiagnosticSession>('/diagnostics', data);
    return res.data;
  },
  start: async (sessionId: string) => {
    const res = await api.post(`/diagnostics/${sessionId}/start`);
    return res.data;
  },
  complete: async (sessionId: string, measurements?: {
    voltage_v?: number;
    current_a?: number;
    temperature_c?: number;
    soc_pct?: number;
    internal_resistance_mohm?: number;
    measured_capacity_ah?: number;
  }) => {
    const res = await api.post(`/diagnostics/${sessionId}/complete`, measurements || {});
    return res.data;
  },
  cancel: async (sessionId: string) => {
    const res = await api.post(`/diagnostics/${sessionId}/cancel`);
    return res.data;
  },
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertApi = {
  list: async (params?: { battery_id?: string; severity?: string; status?: string }) => {
    const res = await api.get<BatteryAlert[]>('/alerts', { params });
    return res.data;
  },
  count: async () => {
    const res = await api.get('/alerts/count');
    return res.data as { total: number; critical: number };
  },
  get: async (alertId: string) => {
    const res = await api.get<BatteryAlert>(`/alerts/${alertId}`);
    return res.data;
  },
  acknowledge: async (alertId: string) => {
    const res = await api.post(`/alerts/${alertId}/acknowledge`);
    return res.data;
  },
  resolve: async (alertId: string, resolution_notes?: string) => {
    const res = await api.post(`/alerts/${alertId}/resolve`, { resolution_notes });
    return res.data;
  },
};

// ── Lifecycle ─────────────────────────────────────────────────────────────────
export const lifecycleApi = {
  getEvents: async (batteryId: string) => {
    const res = await api.get(`/lifecycle/${batteryId}`);
    return res.data as { battery_id: string; events: BatteryLifecycleEvent[] };
  },
  recordEvent: async (batteryId: string, data: {
    event_type: string;
    title: string;
    description?: string;
    soh_at_event?: number;
    rul_at_event?: number;
    risk_at_event?: string;
  }) => {
    const res = await api.post<BatteryLifecycleEvent>(`/lifecycle/${batteryId}/event`, data);
    return res.data;
  },
};

// ── Fleet ─────────────────────────────────────────────────────────────────────
export const fleetApi = {
  listVehicles: async () => {
    const res = await api.get<FleetVehicle[]>('/fleet/vehicles');
    return res.data;
  },
  createVehicle: async (data: {
    vehicle_id: string;
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    battery_id?: string;
  }) => {
    const res = await api.post<FleetVehicle>('/fleet/vehicles', data);
    return res.data;
  },
  updateVehicle: async (vehicleId: string, data: Partial<FleetVehicle>) => {
    const res = await api.put(`/fleet/vehicles/${vehicleId}`, data);
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/fleet/stats');
    return res.data as {
      total_vehicles: number;
      batteries_assigned: number;
      average_soh?: number;
      high_risk_batteries: number;
    };
  },
};

// ── BMS ───────────────────────────────────────────────────────────────────────
export const bmsApi = {
  listDevices: async () => {
    const res = await api.get<BMSDevice[]>('/bms/devices');
    return res.data;
  },
  getDevice: async (bmsId: string) => {
    const res = await api.get<BMSDevice>(`/bms/devices/${bmsId}`);
    return res.data;
  },
  register: async (data: {
    bms_id: string;
    name: string;
    manufacturer?: string;
    model?: string;
    protocol?: string;
    battery_id?: string;
    configuration?: Record<string, unknown>;
  }) => {
    const res = await api.post<BMSDevice>('/bms/devices', data);
    return res.data;
  },
};

export default api;
