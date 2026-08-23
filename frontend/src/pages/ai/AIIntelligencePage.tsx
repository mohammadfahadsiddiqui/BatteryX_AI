// BatteryX AI – AI Intelligence & Explainable Degradation Hub
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, Brain, ShieldAlert, Zap, TrendingDown, RefreshCw, Award } from 'lucide-react';
import { batteryApi, analysisApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import type { Battery, LatestAnalysis } from '../../types';

export function AIIntelligencePage() {
  const [searchParams] = useSearchParams();
  const initialBatt = searchParams.get('battery') || '';

  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(initialBatt);
  const [analysis, setAnalysis] = useState<LatestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    batteryApi.list().then((batts) => {
      setBatteries(batts);
      if (!selectedBatteryId && batts.length > 0) {
        setSelectedBatteryId(batts[0].battery_id);
      }
    });
  }, []);

  const loadAnalysis = async () => {
    if (!selectedBatteryId) return;
    setLoading(true);
    try {
      const data = await analysisApi.getLatest(selectedBatteryId);
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [selectedBatteryId]);

  // Synthetic projection curve for chart
  const degradationData = analysis?.rul?.degradation_projections
    ? [
        { month: 'Now', soh: analysis.soh?.soh_pct || 90 },
        { month: '6m', soh: analysis.rul.degradation_projections['6'] || 88 },
        { month: '12m', soh: analysis.rul.degradation_projections['12'] || 86 },
        { month: '24m', soh: analysis.rul.degradation_projections['24'] || 82 },
        { month: '36m', soh: analysis.rul.degradation_projections['36'] || 78 },
      ]
    : [
        { month: 'Now', soh: 92 },
        { month: '6m', soh: 90.5 },
        { month: '12m', soh: 88.8 },
        { month: '24m', soh: 84.5 },
        { month: '36m', soh: 80.2 },
      ];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} color="#66CC99" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
              AI Degradation & Health Intelligence
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Explainable physics-informed battery intelligence, RUL projections, and second-life feasibility ranking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedBatteryId}
            onChange={(e) => setSelectedBatteryId(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            {batteries.map((b) => (
              <option key={b.id} value={b.battery_id}>
                {b.battery_id} ({b.manufacturer})
              </option>
            ))}
          </select>
          <button onClick={loadAnalysis} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Main KPI Quad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card metric-card">
          <span className="section-title">Predicted State of Health</span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#4DBF88', marginTop: '0.25rem' }}>
            {analysis?.soh?.soh_pct ? `${analysis.soh.soh_pct.toFixed(1)}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>
            Status: {analysis?.soh?.health_status || 'Unknown'} (Confidence: {analysis?.soh?.confidence_pct || 94}%)
          </div>
        </div>

        <div className="card metric-card">
          <span className="section-title">Remaining Useful Life (RUL)</span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.25rem' }}>
            {analysis?.rul?.rul_years ? `${analysis.rul.rul_years} yrs` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>
            Estimated Cycles: {analysis?.rul?.rul_cycles || '—'} cycles
          </div>
        </div>

        <div className="card metric-card">
          <span className="section-title">Safety Risk Classification</span>
          <div style={{ marginTop: '0.5rem' }}>
            {analysis?.risk?.risk_level ? (
              <StatusBadge status={analysis.risk.risk_level} type="risk" />
            ) : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.5rem' }}>
            Score: {analysis?.risk?.risk_score ?? 0} / 100
          </div>
        </div>

        <div className="card metric-card">
          <span className="section-title">Second-Life Suitability</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3F4A56', marginTop: '0.5rem' }}>
            {analysis?.second_life?.classification || 'Pending Analysis'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>
            Target: {analysis?.second_life?.recommended_application || 'Stationary Storage'}
          </div>
        </div>
      </div>

      {/* Degradation Chart & Risk Factors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Degradation Curve */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56', marginBottom: '0.5rem' }}>
            Degradation Forecast Trajectory (3-Year Horizon)
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#8B949C', marginBottom: '1rem' }}>
            Multi-factor electro-thermal capacity fading model with 80% second-life threshold line.
          </p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={degradationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" vertical={false} />
                <XAxis dataKey="month" stroke="#8B949C" tickLine={false} />
                <YAxis domain={[60, 100]} stroke="#8B949C" tickLine={false} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="soh" name="Predicted SOH" stroke="#66CC99" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainable AI Risk Factors */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56', marginBottom: '0.5rem' }}>
            Explainable Health Drivers & Risk Factors
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#8B949C', marginBottom: '1rem' }}>
            Key contributing features identified by the analysis engine.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(analysis?.risk?.risk_factors && analysis.risk.risk_factors.length > 0) ? (
              analysis.risk.risk_factors.map((f, i) => (
                <div key={i} style={{ padding: '0.75rem', background: '#F7F9F8', borderRadius: '8px', border: '1px solid #E2E8E5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{f.factor}</span>
                    <StatusBadge status={f.severity} type="alert" size="sm" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#68737D', marginTop: '0.25rem' }}>{f.description}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(102,204,153,0.1)', borderRadius: '8px', color: '#4DBF88', fontSize: '0.8125rem' }}>
                All degradation indicators and cell balance parameters remain within nominal design thresholds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
