// BatteryX AI – Audit Logs Page
import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAuditLogs().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Audit Logs</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>System activity and user action history</p>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" />Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>No audit logs yet</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id || i}>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{formatDateTime(log.timestamp)}</td>
                  <td><span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{log.action}</span></td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{log.resource_type}</td>
                  <td><code style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{log.resource_id || '—'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
