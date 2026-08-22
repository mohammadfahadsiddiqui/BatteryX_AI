// BatteryX AI – Settings Page
import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Account and platform configuration</p>
      </div>
      <div className="card-lg" style={{ maxWidth: 520 }}>
        <div style={{ fontWeight: 700, marginBottom: '1rem' }}>Account Information</div>
        {[
          ['Full Name', user?.full_name || '—'],
          ['Email', user?.email || '—'],
          ['Role', user?.role || '—'],
          ['User ID', user?.id || '—'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: '1.25rem', padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          To update account settings, contact your platform administrator.
        </div>
      </div>
    </div>
  );
}
