// BatteryX AI – Diagnostics Sessions Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Plus, RefreshCw, Filter, Award, CheckCircle } from 'lucide-react';
import { diagnosticApi, batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataSourceBadge } from '../../components/ui/DataSourceBadge';
import type { DiagnosticSession, Battery } from '../../types';

export function DiagnosticsPage() {
  const [sessions, setSessions] = useState<DiagnosticSession[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBattery, setFilterBattery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sess, batts] = await Promise.all([
        diagnosticApi.list({
          battery_id: filterBattery || undefined,
          status: filterStatus || undefined,
        }),
        batteryApi.list(),
      ]);
      setSessions(sess);
      setBatteries(batts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterBattery, filterStatus]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            Diagnostic Sessions
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Manage test sessions, multi-source telemetry analysis runs, and digital health certifications.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/diagnostics/new" className="btn-primary">
            <Plus size={16} /> New Diagnostic
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#68737D' }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          value={filterBattery}
          onChange={(e) => setFilterBattery(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '180px' }}
        >
          <option value="">All Batteries</option>
          {batteries.map((b) => (
            <option key={b.id} value={b.battery_id}>{b.battery_id}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="RUNNING">Running</option>
          <option value="CREATED">Created</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Battery</th>
              <th>Test Type</th>
              <th>Data Source</th>
              <th>Status</th>
              <th>SOH Result</th>
              <th>Risk Level</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading sessions...</td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
                  No diagnostic sessions recorded. Click "New Diagnostic" to run a health assessment.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#3F4A56', fontFamily: 'monospace' }}>
                      {s.session_id}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.battery_id_str || s.battery_id}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{s.diagnostic_type}</td>
                  <td>
                    <DataSourceBadge source={s.data_source} size="sm" />
                  </td>
                  <td>
                    <StatusBadge status={s.status} type="diagnostic" size="sm" />
                  </td>
                  <td>
                    {s.result_soh_pct !== undefined && s.result_soh_pct !== null ? (
                      <span style={{ fontWeight: 700, color: s.result_soh_pct > 80 ? '#4DBF88' : '#FBC000' }}>
                        {s.result_soh_pct.toFixed(1)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {s.result_risk_level ? (
                      <StatusBadge status={s.result_risk_level} type="risk" size="sm" />
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#68737D' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
