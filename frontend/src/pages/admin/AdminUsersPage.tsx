// BatteryX AI – Admin Users Page
import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import type { User } from '../../types';
import { formatDateTime } from '../../utils/helpers';
import { Shield, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>User Management</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{users.length} registered users</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" />Loading users...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-accent' : 'badge-muted'}`} style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{formatDateTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
