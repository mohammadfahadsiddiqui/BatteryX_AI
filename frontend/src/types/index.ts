// BatteryX AI – Complete TypeScript type definitions (v3.0)

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  organization_id?: string;
  is_active: boolean;
  created_at: string;
}

// ── Battery ───────────────────────────────────────────────────────────────────

export type DataSource = 'manual' | 'csv' | 'json' | 'esp32' | 'bms' | 'can' | 'demo';

export interface Battery {
  id: string;
  battery_id: string;
  manufacturer?: string;
  model?: string;
  chemistry?: string;
  rated_capacity_ah?: number;
  rated_voltage_v?: number;
  age_years?: number;
  cycle_count?: number;
  is_demo: boolean;
  status: string;
  notes?: string;
  created_at: string;
  // Enriched from latest analysis
  latest_soh?: number;
  latest_rul?: number;
  latest_risk?: string;
  latest_second_life?: string;
  latest_voltage?: number;
  latest_temperature?: number;
}

export interface BatteryReading {
  id: string;
  battery_id: string;
  timestamp: string;
  voltage_v?: number;
  current_a?: number;
  temperature_c?: number;
  soc_pct?: number;
  internal_resistance_mohm?: number;
  capacity_ah?: number;
  source: DataSource;
}

// ── Live Telemetry ────────────────────────────────────────────────────────────

export interface LiveTelemetry {
  id: string;
  battery_id: string;
  timestamp: string;
  voltage_v?: number;
  current_a?: number;
  power_w?: number;
  energy_wh?: number;
  temperature_c?: number;
  min_cell_temp_c?: number;
  max_cell_temp_c?: number;
  soc_pct?: number;
  soh_pct?: number;
  internal_resistance_mohm?: number;
  cycle_count?: number;
  cell_voltages?: number[];
  cell_temperatures?: number[];
  bms_status?: string;
  fault_codes?: string[];
  charging_state?: boolean;
  discharging_state?: boolean;
  source: DataSource;
  data_quality_score?: number;
  is_demo: boolean;
}

// ── Hardware Devices ──────────────────────────────────────────────────────────

export type DeviceStatus =
  | 'BOOTING' | 'INITIALIZING' | 'CONNECTING' | 'CONNECTED'
  | 'MEASURING' | 'TRANSMITTING' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

export interface HardwareDevice {
  id: string;
  device_id: string;
  name: string;
  device_type: string;  // ESP32, Raspberry Pi, Industrial Gateway, BMS Gateway, CAN Gateway
  status: DeviceStatus;
  firmware_version?: string;
  connection_type: string;
  signal_strength_dbm?: number;
  telemetry_rate_hz: number;
  battery_id?: string;
  organization_id?: string;
  is_active: boolean;
  last_seen?: string;
  last_telemetry_at?: string;
  ip_address?: string;
  mac_address?: string;
  notes?: string;
  created_at: string;
}

export interface DeviceEvent {
  id: string;
  event_type: string;
  severity: string;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// ── Diagnostic Sessions ───────────────────────────────────────────────────────

export type DiagnosticStatus =
  | 'CREATED' | 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface DiagnosticSession {
  id: string;
  session_id: string;
  battery_id: string;
  battery_id_str?: string;
  battery_manufacturer?: string;
  device_id?: string;
  diagnostic_type: string;
  data_source: DataSource;
  status: DiagnosticStatus;
  data_quality_score?: number;
  measurements_count: number;
  notes?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  // Results
  result_soh_pct?: number;
  result_rul_years?: number;
  result_risk_level?: string;
  result_second_life_score?: number;
  result_second_life_class?: string;
  result_recommended_action?: string;
  result_anomalies?: unknown[];
  result_explanation?: string[];
  ai_model_version: string;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'AUTO_RESOLVED';

export interface BatteryAlert {
  id: string;
  alert_id: string;
  battery_id: string;
  battery_id_str?: string;
  device_id?: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  triggered_value?: number;
  threshold_value?: number;
  unit?: string;
  source: string;
  status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  is_demo: boolean;
  created_at: string;
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export interface BatteryLifecycleEvent {
  id: string;
  battery_id: string;
  event_type: string;
  title: string;
  description?: string;
  soh_at_event?: number;
  rul_at_event?: number;
  risk_at_event?: string;
  performed_by?: string;
  details?: Record<string, unknown>;
  event_date: string;
}

// ── Fleet ─────────────────────────────────────────────────────────────────────

export interface FleetVehicle {
  id: string;
  vehicle_id: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  battery_id_str?: string;
  battery_soh?: number;
  organization_id?: string;
  status: string;
  notes?: string;
  created_at: string;
}

// ── BMS ───────────────────────────────────────────────────────────────────────

export interface BMSDevice {
  id: string;
  bms_id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  firmware_version?: string;
  protocol?: string;
  adapter_class?: string;
  battery_id_str?: string;
  hardware_device_id?: string;
  status: string;
  last_seen?: string;
  is_active: boolean;
  created_at: string;
}

// ── Analysis & AI ─────────────────────────────────────────────────────────────

export interface SOHResult {
  soh_pct: number;
  health_status: string;
  confidence_pct?: number;
  method?: string;
  notes?: string;
  features_used?: Record<string, number>;
}

export interface RULResult {
  rul_years: number;
  rul_cycles: number;
  confidence_pct?: number;
  degradation_projections?: Record<string, number>;
  notes?: string;
  degradation?: {
    months_6: number;
    months_12: number;
    months_24: number;
    months_36: number;
    annual_rate_pct: number;
  };
}

export interface RiskResult {
  risk_score: number;
  risk_level: string;
  risk_factors?: Array<{ factor: string; severity: string; description: string; value?: number }>;
  recommended_action?: string;
  disclaimer?: string;
}

export interface SecondLifeResult {
  second_life_score: number;
  classification: string;
  recommended_application?: string;
  reasoning?: string[];
}

export interface AnalysisResponse {
  battery_id: string;
  diagnostic_test_id: string;
  soh: SOHResult;
  rul: RULResult;
  risk: RiskResult;
  second_life: SecondLifeResult;
  recommended_action: string;
  explanation_points: string[];
  analyzed_at: string;
}

export interface LatestAnalysis {
  battery_id: string;
  soh?: SOHResult;
  rul?: RULResult & { degradation_projections?: Record<string, number> };
  risk?: RiskResult;
  second_life?: SecondLifeResult;
  latest_reading?: {
    voltage_v?: number;
    current_a?: number;
    temperature_c?: number;
    soc_pct?: number;
    internal_resistance_mohm?: number;
    timestamp?: string;
  };
}

// ── Certificates ──────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  certificate_id: string;
  battery_id: string;
  soh_pct: number;
  rul_years: number;
  risk_level: string;
  second_life_classification?: string;
  recommended_application?: string;
  cycle_count?: number;
  assessment_summary?: string;
  issued_at: string;
  valid_until?: string;
  is_valid: boolean;
  pdf_path?: string;
}

export interface VerifyResponse {
  valid?: boolean;
  is_valid?: boolean;
  certificate_id: string;
  battery_id: string;
  issued_at: string;
  verified_at?: string;
  issuer?: string;
  soh_pct: number;
  rul_years: number;
  risk_level: string;
  second_life_classification?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_batteries: number;
  average_soh: number;
  high_risk_count: number;
  second_life_eligible: number;
  health_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  second_life_distribution: Record<string, number>;
  recent_diagnostics: Array<{
    battery_id: string;
    soh?: number;
    risk?: string;
    second_life?: string;
    last_analysis: string;
    is_demo: boolean;
  }>;
}

// ── WebSocket Events ──────────────────────────────────────────────────────────

export type WSEventType =
  | 'telemetry_update'
  | 'battery_connected'
  | 'battery_disconnected'
  | 'device_connected'
  | 'device_disconnected'
  | 'temperature_warning'
  | 'voltage_warning'
  | 'current_warning'
  | 'cell_imbalance_warning'
  | 'bms_fault'
  | 'critical_alert'
  | 'heartbeat'
  | 'pong';

export interface WSMessage {
  event: WSEventType;
  battery_id?: string;
  data?: unknown;
  message?: string;
}
