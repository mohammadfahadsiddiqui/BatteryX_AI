// BatteryX AI – Dashboard Page
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Battery, AlertTriangle, TrendingUp, Recycle, Plus, Activity } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';
import { getRiskColor, getSOHColor, formatDateTime } from '../utils/helpers';
import RiskBadge from '../components/ui/RiskBadge';

const HEALTH_COLORS: Record<string, string> = {
  Excellent: '#66CC99', Good: '#7ED3A6', Fair: '#FBC000', Poor: '#FF9A62', Critical: '#FF633D',
};
const RISK_COLORS: Record<string, string> = { LOW: '#66CC99', MODERATE: '#FBC000', HIGH: '#FF633D' };
const SL_COLORS = ['#66CC99', '#9ADDBB', '#FBC000', '#FF633D'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.8125rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>{label || payload[0]?.name}</div>
        <div style={{ fontWeight: 700, color: payload[0]?.color || '#66CC99' }}>{payload[0]?.value}</div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.getStats().then(setStats).catch(() => setError('Failed to load dashboard')).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem' }}>
      <div className="spinner" style={{ width: 24, height: 24 }} />
      <span style={{ color: 'var(--color-text-muted)' }}>Loading dashboard...</span>
    </div>
  );

  if (error) return <div style={{ color: 'var(--color-danger)', padding: '2rem' }}>{error}</div>;
  if (!stats) return null;

  const summaryCards = [
    { label: 'Total Batteries', value: stats.total_batteries.toLocaleString(), icon: Battery, color: '#66CC99', link: '/batteries' },
    { label: 'Average SOH', value: `${stats.average_soh}%`, icon: TrendingUp, color: getSOHColor(stats.average_soh) },
    { label: 'High Risk', value: stats.high_risk_count.toString(), icon: AlertTriangle, color: '#FF633D', link: '/batteries?risk=HIGH' },
    { label: 'Second-Life Eligible', value: stats.second_life_eligible.toString(), icon: Recycle, color: '#66CC99' },
  ];

  const healthData = Object.entries(stats.health_distribution).map(([name, value]) => ({ name, value }));
  const riskData = Object.entries(stats.risk_distribution).map(([name, value]) => ({ name, value }));
  const slData = Object.entries(stats.second_life_distribution).map(([name, value]) => ({ name, value }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: 4, color: 'var(--color-text-primary)' }}>Battery Intelligence Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Monitor battery health, degradation, safety and second-life potential
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/batteries/add" className="btn-primary"><Plus size={16} />Add Battery</Link>
        </div>
      </div>

      <div className="demo-banner" style={{ marginBottom: '1.5rem' }}>
        ⚠ DEMO DATA — All metrics shown are generated from simulated batteries for demonstration purposes. Not real-world measurements.
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map((c) => (
          <div key={c.label} className="metric-card" style={{ borderLeft: `3px solid ${c.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{c.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.icon size={18} color={c.color} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color, letterSpacing: '-0.03em' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Health Distribution */}
        <div className="card">
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Battery Health Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={healthData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EEEB" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {healthData.map((entry, i) => (
                  <Cell key={i} fill={HEALTH_COLORS[entry.name] || '#8B949C'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Risk Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={RISK_COLORS[entry.name] || '#8B949C'} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any, name: any) => [val, name]} contentStyle={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.8125rem' }} />
              <Legend formatter={(val) => <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Second-Life Classification */}
        <div className="card">
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Second-Life Classification</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={slData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {slData.map((_, i) => <Cell key={i} fill={SL_COLORS[i % SL_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.8125rem' }} />
              <Legend formatter={(val) => <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Batteries Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>Recent Batteries</span>
          <Link to="/batteries" style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Battery ID</th>
                <th>SOH</th>
                <th>Risk Level</th>
                <th>Second-Life Path</th>
                <th>Last Analysis</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_diagnostics.map((d) => (
                <tr key={d.battery_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', background: 'var(--color-accent-subtle)', padding: '0.125rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>{d.battery_id}</code>
                      {d.is_demo && <span className="badge badge-muted" style={{ fontSize: '0.625rem' }}>DEMO</span>}
                    </div>
                  </td>
                  <td>
                    {d.soh != null ? (
                      <span style={{ fontWeight: 700, color: getSOHColor(d.soh) }}>{d.soh.toFixed(1)}%</span>
                    ) : '—'}
                  </td>
                  <td><RiskBadge risk={d.risk} size="sm" /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{d.second_life || '—'}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{formatDateTime(d.last_analysis)}</td>
                  <td>
                    <Link to={`/batteries/${d.battery_id}`} className="btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
