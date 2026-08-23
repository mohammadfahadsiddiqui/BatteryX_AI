// BatteryX AI – Maintenance & Service Schedule Page
import { useState, useEffect } from 'react';
import { Wrench, Calendar, CheckCircle, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { batteryApi } from '../../services/api';
import type { Battery } from '../../types';

export function MaintenancePage() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const batts = await batteryApi.list();
      setBatteries(batts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            Preventative Maintenance & Service Scheduling
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Predictive servicing triggers, cell rebalancing schedules, and warranty inspection milestones.
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Maintenance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Wrench size={18} color="#66CC99" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Cell Balancing Cycle</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#68737D' }}>
            Triggered automatically when pack cell voltage delta ΔV exceeds 80mV during CV charging.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar size={18} color="#C89800" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Periodic Recertification</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#68737D' }}>
            Recommended every 6 months or 500 equivalent full cycles to maintain passport validity.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={18} color="#4DBF88" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Thermal Inspection</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#68737D' }}>
            Verification of cooling loop delta-T and thermistor calibration offset checks.
          </p>
        </div>
      </div>

      {/* Battery Maintenance Status Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Battery Pack</th>
              <th>Current SOH</th>
              <th>Cycle Count</th>
              <th>Next Scheduled Inspection</th>
              <th>Action Needed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading schedule...</td></tr>
            ) : batteries.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#8B949C' }}>No batteries found.</td></tr>
            ) : (
              batteries.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#3F4A56' }}>{b.battery_id}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B949C' }}>{b.manufacturer} {b.model}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: (b.latest_soh || 90) > 80 ? '#4DBF88' : '#FBC000' }}>
                      {b.latest_soh ? `${b.latest_soh.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                  <td>{b.cycle_count || 0} cycles</td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {new Date(Date.now() + 90 * 86400000).toLocaleDateString()}
                  </td>
                  <td>
                    {(b.latest_soh && b.latest_soh < 80) ? (
                      <span className="badge badge-warning">Second-Life Review</span>
                    ) : (
                      <span className="badge badge-success">Nominal</span>
                    )}
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
