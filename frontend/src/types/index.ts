// BatteryX AI – TypeScript Types

export interface Battery {
  id: string;
  battery_id: string;
  manufacturer?: string;
  model?: string;
  chemistry?: string;
  rated_capacity_ah?: number;
  rated_voltage_v?: number;
  age_years?: number;
  cycle_count: number;
  is_demo: boolean;
  status: string;
  notes?: string;
  created_at: string;
  latest_soh?: number;
  latest_rul?: number;
  latest_risk?: 'LOW' | 'MODERATE' | 'HIGH';
  latest_second_life?: string;
  latest_voltage?: number;
  latest_temperature?: number;
}

export interface BatteryReading {
  id: string;
  timestamp: string;
  voltage_v?: number;
  current_a?: number;
  temperature_c?: number;
  soc_pct?: number;
  internal_resistance_mohm?: number;
  source: string;
}

export interface SOHResult {
  soh_pct: number;
  health_status: string;
  confidence_pct: number;
  method: string;
  notes: string;
  features_used?: Record<string, number>;
}

export interface DegradationProjection {
  months_6: number;
  months_12: number;
  months_24: number;
  months_36: number;
  annual_rate_pct: number;
  eol_soh_threshold_pct: number;
}

export interface RULResult {
  rul_years: number;
  rul_cycles: number;
  confidence_pct: number;
  degradation: DegradationProjection;
  notes: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  description: string;
  value?: number;
}

export interface RiskResult {
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  risk_factors: RiskFactor[];
  recommended_action: string;
  disclaimer: string;
}

export interface SecondLifeResult {
  second_life_score: number;
  classification: string;
  recommended_application: string;
  reasoning: string[];
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
  rul?: { rul_years: number; rul_cycles: number; degradation_projections: Record<string, number> };
  risk?: { risk_score: number; risk_level: string; risk_factors: RiskFactor[]; recommended_action: string };
  second_life?: { second_life_score: number; classification: string; recommended_application: string; reasoning: string[] };
  latest_reading?: {
    voltage_v: number;
    current_a: number;
    temperature_c: number;
    soc_pct: number;
    internal_resistance_mohm: number;
    timestamp: string;
  };
}

export interface Certificate {
  id: string;
  certificate_id: string;
  battery_id: string;
  soh_pct: number;
  rul_years: number;
  risk_level: string;
  second_life_classification: string;
  recommended_application: string;
  cycle_count: number;
  assessment_summary: string;
  issued_at: string;
  is_valid: boolean;
}

export interface VerifyResponse {
  is_valid: boolean;
  certificate_id: string;
  battery_id: string;
  soh_pct: number;
  rul_years: number;
  risk_level: string;
  second_life_classification: string;
  issued_at: string;
  verified_at: string;
  issuer: string;
}

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
    last_analysis?: string;
    is_demo: boolean;
  }>;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  token: string | null;
  user: { id: string; email: string; full_name?: string; role: string } | null;
  isAuthenticated: boolean;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type HealthStatus = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

