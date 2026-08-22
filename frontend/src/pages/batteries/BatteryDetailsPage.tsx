// BatteryX AI – Battery Details Page (tabbed view)
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Battery, Zap, Thermometer, Activity, BarChart3,
  Shield, Recycle, Award, FileText, Play, RefreshCw
} from 'lucide-react';
import { batteryApi, analysisApi, certificateApi } from '../../services/api';
import type { Battery as BatteryType, LatestAnalysis } from '../../types';
import SOHGauge from '../../components/charts/SOHGauge';
import DegradationChart from '../../components/charts/DegradationChart';
import RiskBadge from '../../components/ui/RiskBadge';
import AnalysisRunnerPage from '../AnalysisRunnerPage';
import { getSOHColor, getRiskColor, getSecondLifeBadgeClass, formatDate, formatNumber } from '../../utils/helpers';

type Tab = 'overview' | 'telemetry' | 'analysis' | 'degradation' | 'safety' | 'second-life' | 'certificate';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Battery },
  { key: 'analysis', label: 'AI Analysis', icon: BarChart3 },
  { key: 'degradation', label: 'Degradation', icon: Activity },
  { key: 'safety', label: 'Safety Risk', icon: Shield },
  { key: 'second-life', label: 'Second-Life', icon: Recycle },
  { key: 'certificate', label: 'Certificate', icon: Award },
];

export default function BatteryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [battery, setBattery] = useState<BatteryType | null>(null);
  const [analysis, setAnalysis] = useState<LatestAnalysis | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [genCertLoading, setGenCertLoading] = useState(false);
  const [certMessage, setCertMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([batteryApi.get(id), analysisApi.getLatest(id)])
      .then(([b, a]) => { setBattery(b); setAnalysis(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const generateCert = async () => {
    if (!id) return;
    setGenCertLoading(true);
    try {
      const cert = await certificateApi.generate(id);
      setCertMessage(`Certificate ${cert.certificate_id} generated!`);
      setTab('certificate');
    } catch (err: any) {
      setCertMessage(err.response?.data?.detail || 'Failed to generate certificate');
    } finally { setGenCertLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
      <div className="spinner" style={{ width: 24, height: 24 }} />
      <span style={{ color: 'var(--color-text-muted)' }}>Loading battery...</span>
    </div>
  );

  if (!battery) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>Battery not found</div>
      <Link to="/batteries" className="btn-secondary">Back to Inventory</Link>
    </div>
  );

  const soh = analysis?.soh?.soh_pct;
  const rul = analysis?.rul?.rul_years;
  const risk = analysis?.risk?.risk_level as any;
  const sl = analysis?.second_life;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/batteries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={15} />Battery Inventory
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{battery.battery_id}</h1>
              {battery.is_demo && <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>DEMO DATA</span>}
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {battery.manufacturer} • {battery.model} • {battery.chemistry}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setTab('analysis')} style={{ fontSize: '0.8125rem' }}>
              <Play size={14} />Run Analysis
            </button>
            <button className="btn-primary" onClick={generateCert} disabled={genCertLoading || !analysis?.soh} style={{ fontSize: '0.8125rem' }}>
              <Award size={14} />Generate Certificate
            </button>
          </div>
        </div>
      </div>

      {certMessage && (
        <div style={{ background: 'var(--color-success-subtle)', border: '1px solid rgba(102,204,153,0.25)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#4DBF88' }}>
          {certMessage}
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'SOH', value: soh != null ? `${soh.toFixed(1)}%` : 'No analysis', color: getSOHColor(soh) },
          { label: 'RUL Estimate', value: rul != null ? `${rul}y` : '—', color: 'var(--color-accent)' },
          { label: 'Cycle Count', value: battery.cycle_count?.toLocaleString() || '0', color: 'var(--color-text-primary)' },
          { label: 'Age', value: battery.age_years ? `${battery.age_years}y` : '—', color: 'var(--color-text-primary)' },
          { label: 'Voltage', value: analysis?.latest_reading?.voltage_v ? `${analysis.latest_reading.voltage_v}V` : '—', color: 'var(--color-text-primary)' },
          { label: 'Temperature', value: analysis?.latest_reading?.temperature_c ? `${analysis.latest_reading.temperature_c}°C` : '—', color: (analysis?.latest_reading?.temperature_c ?? 0) > 40 ? 'var(--color-danger)' : 'var(--color-text-primary)' },
        ].map(s => (
          <div key={s.label} className="metric-card" style={{ padding: '0.875rem' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={13} style={{ display: 'inline', marginRight: 4 }} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="section-title">Battery Specifications</div>
            {[
              ['Battery ID', battery.battery_id],
              ['Manufacturer', battery.manufacturer || '—'],
              ['Model', battery.model || '—'],
              ['Chemistry', battery.chemistry || '—'],
              ['Rated Capacity', battery.rated_capacity_ah ? `${battery.rated_capacity_ah} Ah` : '—'],
              ['Rated Voltage', battery.rated_voltage_v ? `${battery.rated_voltage_v} V` : '—'],
              ['Cycle Count', battery.cycle_count?.toLocaleString()],
              ['Age', battery.age_years ? `${battery.age_years} years` : '—'],
              ['Status', battery.status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {soh != null ? (
              <>
                <SOHGauge soh={soh} size={180} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Risk Level</span>
                    <RiskBadge risk={risk} />
                  </div>
                  {sl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Second-Life</span>
                      <span className={getSecondLifeBadgeClass(sl.classification)} style={{ fontSize: '0.75rem' }}>{sl.classification}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <BarChart3 size={40} style={{ color: 'var(--color-border)', margin: '0 auto 0.75rem' }} />
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  No analysis data yet
                </div>
                <button className="btn-primary" onClick={() => setTab('analysis')} style={{ fontSize: '0.8125rem' }}>
                  <Play size={14} />Run First Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'analysis' && (
        <AnalysisRunnerPage batteryId={id!} battery={battery} onComplete={(result) => {
          setAnalysis({
            battery_id: result.battery_id,
            soh: result.soh,
            rul: { rul_years: result.rul.rul_years, rul_cycles: result.rul.rul_cycles, degradation_projections: { '6': result.rul.degradation.months_6, '12': result.rul.degradation.months_12, '24': result.rul.degradation.months_24, '36': result.rul.degradation.months_36 } },
            risk: { risk_score: result.risk.risk_score, risk_level: result.risk.risk_level, risk_factors: result.risk.risk_factors, recommended_action: result.risk.recommended_action },
            second_life: result.second_life,
          });
          setTab('overview');
        }} />
      )}

      {tab === 'degradation' && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Battery Degradation Projection</div>
          {analysis?.rul ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Current SOH', value: `${soh?.toFixed(1)}%` },
                  { label: '12 Months', value: `${analysis.rul.degradation_projections?.['12']?.toFixed(1) ?? '—'}%` },
                  { label: '24 Months', value: `${analysis.rul.degradation_projections?.['24']?.toFixed(1) ?? '—'}%` },
                  { label: '36 Months', value: `${analysis.rul.degradation_projections?.['36']?.toFixed(1) ?? '—'}%` },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: '0.875rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getSOHColor(parseFloat(m.value)) }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <DegradationChart currentSOH={soh!} projections={analysis.rul.degradation_projections} />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Run an analysis first to see degradation projections</div>
          )}
        </div>
      )}

      {tab === 'safety' && analysis?.risk && (
        <div>
          <div className="demo-banner" style={{ marginBottom: '1rem' }}>
            ⚠ PROTOTYPE — This rule-based risk assessment is for demonstration purposes only. NOT a certified battery safety evaluation.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <div className="section-title">Risk Summary</div>
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8,
                  color: analysis.risk.risk_level === 'LOW' ? '#66CC99' : analysis.risk.risk_level === 'MODERATE' ? '#FBC000' : '#FF633D',
                }}>
                  {analysis.risk.risk_level}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Risk Score: {analysis.risk.risk_score?.toFixed(1)}/100</div>
                <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: '0.875rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                  {analysis.risk.recommended_action}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-title">Risk Factors</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {analysis.risk.risk_factors?.map((f: any, i: number) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{f.factor}</span>
                      <RiskBadge risk={f.severity} size="sm" />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{f.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'second-life' && analysis?.second_life && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="section-title">Second-Life Assessment</div>
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#66CC99', letterSpacing: '-0.03em', marginBottom: 4 }}>
                {analysis.second_life.second_life_score?.toFixed(0)}<span style={{ fontSize: '1.25rem' }}>/100</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>{analysis.second_life.classification}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Recommended: <strong style={{ color: '#66CC99' }}>{analysis.second_life.recommended_application}</strong>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Assessment Reasoning</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {analysis.second_life.reasoning?.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: '0.625rem', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1, fontWeight: 700 }}>→</span>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'certificate' && (
        <CertificateTab batteryId={id!} battery={battery} analysis={analysis} />
      )}

      {/* Placeholder for tabs without analysis */}
      {(tab === 'safety' || tab === 'second-life') && !analysis?.soh && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Run an analysis first to see {tab} data
          <div style={{ marginTop: '1rem' }}>
            <button className="btn-primary" onClick={() => setTab('analysis')} style={{ fontSize: '0.8125rem' }}>
              <Play size={14} />Run Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Certificate Tab ----
function CertificateTab({ batteryId, battery, analysis }: { batteryId: string; battery: BatteryType; analysis: LatestAnalysis | null }) {
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!analysis?.soh) { setError('Run an analysis first'); return; }
    setLoading(true); setError('');
    try {
      const c = await certificateApi.generate(batteryId);
      setCert(c);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate certificate');
    } finally { setLoading(false); }
  };

  const downloadPdf = async () => {
    if (!cert) return;
    setPdfLoading(true);
    try { await certificateApi.downloadPdf(cert.certificate_id); } finally { setPdfLoading(false); }
  };

  if (!analysis?.soh) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
      <Award size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-border)' }} />
      <div style={{ marginBottom: '1rem' }}>Run an analysis before generating a certificate</div>
    </div>
  );

  return (
    <div>
      {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
      {!cert ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Award size={56} style={{ margin: '0 auto 1rem', color: 'var(--color-accent)' }} />
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: 'var(--color-text-primary)' }}>Generate Battery Health Certificate</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
            Create a digital health certificate with QR verification for battery {battery.battery_id}
          </div>
          <button className="btn-primary" onClick={generate} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} />Generating...</> : <><Award size={16} />Generate Certificate</>}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Certificate Preview */}
          <div style={{
            background: '#FFFFFF', border: '1px solid var(--color-border-light)',
            borderRadius: 16, padding: '2rem', marginBottom: '1.25rem',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#66CC99', marginBottom: 2 }}>BatteryX AI</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Battery Health Certificate</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Certificate ID</div>
                <code style={{ fontSize: '0.875rem', color: '#66CC99', fontWeight: 700 }}>{cert.certificate_id}</code>
              </div>
            </div>

            <div className="demo-banner" style={{ marginBottom: '1.25rem', fontSize: '0.6875rem' }}>
              ⚠ DEMO CERTIFICATE — Generated from simulated data. Not a validated real-world assessment.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'State of Health', value: `${cert.soh_pct}%`, color: getSOHColor(cert.soh_pct) },
                { label: 'Est. RUL', value: `${cert.rul_years}y`, color: 'var(--color-accent)' },
                { label: 'Risk Level', value: cert.risk_level, color: cert.risk_level === 'LOW' ? '#66CC99' : cert.risk_level === 'MODERATE' ? '#FBC000' : '#FF633D' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1.625rem', fontWeight: 900, color: m.color, letterSpacing: '-0.03em' }}>{m.value}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {[
              ['Battery ID', cert.battery_id],
              ['Cycle Count', cert.cycle_count?.toLocaleString()],
              ['Second-Life Classification', cert.second_life_classification],
              ['Recommended Application', cert.recommended_application],
              ['Issued', new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              {cert.assessment_summary}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#66CC99' }} />
              <span style={{ fontSize: '0.8125rem', color: '#4DBF88', fontWeight: 600 }}>Certificate Valid</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} />Generating PDF...</> : <><FileText size={16} />Download PDF</>}
            </button>
            <a href={`/verify/${cert.certificate_id}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '0.875rem' }}>
              Verify Certificate
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
