// BatteryX AI – Alerts & Fault Management Page
import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, RefreshCw, Filter, Check } from 'lucide-react';
import { alertApi, batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { BatteryAlert, Battery } from '../../types';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<BatteryAlert[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [alts, batts] = await Promise.all([
        alertApi.list({
          severity: filterSeverity || undefined,
          status: filterStatus || undefined,
        }),
        batteryApi.list(),
      ]);
      setAlerts(alts);
      setBatteries(batts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSeverity, filterStatus]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertApi.acknowledge(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertApi.resolve(id, 'Resolved via web console');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            Alerts & Anomaly Operations
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Real-time threshold violation logs, thermal runaway safeguards, and BMS safety events.
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#68737D' }}>
          <Filter size={16} /> Filters:
        </div>

        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '150px' }}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '150px' }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Alerts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Severity</th>
              <th>Battery Target</th>
              <th>Alert Type & Message</th>
              <th>Triggered / Limit</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading alerts...</td></tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
                  No active or historical alerts matching criteria. All systems operating nominally.
                </td>
              </tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8B949C' }}>
                      {a.alert_id}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={a.severity} type="alert" size="sm" />
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{a.battery_id_str || a.battery_id}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#3F4A56' }}>{a.alert_type}</div>
                    <div style={{ fontSize: '0.75rem', color: '#68737D' }}>{a.message}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {a.triggered_value !== undefined && a.triggered_value !== null ? (
                      <span>{a.triggered_value} {a.unit} / {a.threshold_value} {a.unit}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <StatusBadge status={a.status} type="alert" size="sm" />
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#68737D' }}>
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {a.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleAcknowledge(a.alert_id)}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          title="Acknowledge Alert"
                        >
                          Ack
                        </button>
                      )}
                      {a.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolve(a.alert_id)}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#4DBF88' }}
                          title="Resolve Alert"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
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
