// BatteryX AI – Analysis Runner (embedded in Battery Details)
import React, { useState } from 'react';
import { CheckCircle, Loader2, Play, AlertCircle } from 'lucide-react';
import { analysisApi } from '../services/api';
import type { Battery, AnalysisResponse } from '../types';
import SOHGauge from '../components/charts/SOHGauge';
import RiskBadge from '../components/ui/RiskBadge';
import DegradationChart from '../components/charts/DegradationChart';

interface Props {
  batteryId: string;
  battery: Battery;
  onComplete?: (result: AnalysisResponse) => void;
}

const PIPELINE_STEPS = [
  'Validating input data',
  'Cleaning and normalizing parameters',
  'Extracting battery features',
  'Running SOH estimation',
  'Calculating degradation projection',
  'Estimating Remaining Useful Life',
  'Performing safety risk assessment',
  'Evaluating second-life suitability',
  'Generating analysis report',
];

export default function AnalysisRunnerPage({ batteryId, battery, onComplete }: Props) {
  const [form, setForm] = useState({
    voltage_v: battery.latest_voltage?.toString() || '396.8',
    current_a: '-42.3',
    temperature_c: '28.4',
    soc_pct: '74.2',
    internal_resistance_mohm: '18.5',
    measured_capacity_ah: '',
  });
  const [running, setRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const runAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true); setPipelineStep(0); setResult(null); setError('');

    // Animate pipeline steps
    for (let i = 0; i < PIPELINE_STEPS.length - 1; i++) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 180));
      setPipelineStep(i + 1);
    }

    try {
      const res = await analysisApi.run(batteryId, {
        voltage_v: parseFloat(form.voltage_v),
        current_a: parseFloat(form.current_a),
        temperature_c: parseFloat(form.temperature_c),
        soc_pct: parseFloat(form.soc_pct),
        internal_resistance_mohm: parseFloat(form.internal_resistance_mohm),
        measured_capacity_ah: form.measured_capacity_ah ? parseFloat(form.measured_capacity_ah) : undefined,
      });
      setPipelineStep(PIPELINE_STEPS.length);
      setResult(res);
      onComplete?.(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed');
      setRunning(false);
      setPipelineStep(-1);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="demo-banner" style={{ marginBottom: '1.25rem' }}>
        ⚠ DEMO DATA — Results are prototype estimates from the BatteryX AI physics-based engine. Not scientifically validated.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
        {/* Input Form */}
        <div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem', color: 'var(--color-text-primary)' }}>Battery Parameters</div>
            <form onSubmit={runAnalysis}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                {[
                  { key: 'voltage_v', label: 'Voltage (V)', placeholder: '396.8' },
                  { key: 'current_a', label: 'Current (A)', placeholder: '-42.3' },
                  { key: 'temperature_c', label: 'Temperature (°C)', placeholder: '28.4' },
                  { key: 'soc_pct', label: 'State of Charge (%)', placeholder: '74.2' },
                  { key: 'internal_resistance_mohm', label: 'Internal Resistance (mΩ)', placeholder: '18.5' },
                  { key: 'measured_capacity_ah', label: 'Measured Capacity (Ah)', placeholder: 'Optional' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '0.875rem' }}>
                    <label className="label">{f.label}</label>
                    <input
                      type="number" step="any" className="input-field"
                      placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                      onChange={set(f.key as keyof typeof form)}
                      required={f.key !== 'measured_capacity_ah'}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  <AlertCircle size={15} />{error}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={running}>
                {running ? <><div className="spinner" style={{ width: 16, height: 16 }} />Analyzing...</> : <><Play size={16} />Run AI Analysis</>}
              </button>
            </form>
          </div>

          {/* Pipeline animation */}
          {(running || result) && (
            <div className="card" style={{ marginTop: '0.875rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.875rem', color: 'var(--color-text-primary)' }}>Analysis Pipeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {PIPELINE_STEPS.map((step, i) => {
                  const done = pipelineStep > i || !!result;
                  const active = pipelineStep === i && running;
                  return (
                    <div key={i} className={`pipeline-step ${done ? 'done' : active ? 'active' : 'pending'}`}>
                      <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {done ? <CheckCircle size={16} color="#66CC99" /> :
                          active ? <div className="spinner" style={{ width: 16, height: 16 }} /> :
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-border)' }} />}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400, color: 'var(--color-text-secondary)' }}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* SOH + Key metrics */}
            <div className="card" style={{ textAlign: 'center' }}>
              <SOHGauge soh={result.soh.soh_pct} size={160} />
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', textAlign: 'left' }}>
                {[
                  { label: 'RUL Estimate', value: `${result.rul.rul_years}y`, sub: `${result.rul.rul_cycles.toLocaleString()} cycles` },
                  { label: 'Risk Level', value: result.risk.risk_level, sub: `Score: ${result.risk.risk_score.toFixed(0)}/100` },
                  { label: 'Second-Life Score', value: `${result.second_life.second_life_score.toFixed(0)}/100`, sub: result.second_life.classification },
                  { label: 'Confidence', value: `${result.soh.confidence_pct}%`, sub: result.soh.method.replace(/_/g, ' ') },
                ].map(m => (
                  <div key={m.label} style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{m.value}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Degradation chart */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.625rem', color: 'var(--color-text-primary)' }}>Degradation Projection</div>
              <DegradationChart
                currentSOH={result.soh.soh_pct}
                projections={{ '6': result.rul.degradation.months_6, '12': result.rul.degradation.months_12, '24': result.rul.degradation.months_24, '36': result.rul.degradation.months_36 }}
                annualRate={result.rul.degradation.annual_rate_pct}
                small
              />
            </div>

            {/* Explanation */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Analysis Explanation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {result.explanation_points.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', padding: '0.375rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-accent)', flexShrink: 0, fontWeight: 700 }}>→</span>{p}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                {result.soh.notes}
              </div>
            </div>

            {/* Recommended action */}
            <div style={{ padding: '1rem', background: 'var(--color-accent-subtle)', border: '1px solid rgba(102,204,153,0.25)', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {result.recommended_action}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
