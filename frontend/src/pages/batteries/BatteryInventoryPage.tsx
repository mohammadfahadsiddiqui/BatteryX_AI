// BatteryX AI – Battery Inventory Page
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Battery, Filter, ChevronRight } from 'lucide-react';
import { batteryApi } from '../../services/api';
import type { Battery as BatteryType } from '../../types';
import { getSOHColor, getRiskBadgeClass, getSecondLifeBadgeClass, formatDate } from '../../utils/helpers';
import RiskBadge from '../../components/ui/RiskBadge';

const CHEMISTRY_OPTIONS = ['Li-ion NMC', 'LFP', 'Li-ion NCA', 'NMC 811', 'NMC 622'];

export default function BatteryInventoryPage() {
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterChemistry, setFilterChemistry] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    batteryApi.list(search || undefined, filterChemistry || undefined, filterRisk || undefined)
      .then(setBatteries).finally(() => setLoading(false));
  }, [search, filterRisk, filterChemistry]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Battery Inventory</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {batteries.length} batteries • Manage, search and filter your battery fleet
          </p>
        </div>
        <Link to="/batteries/add" className="btn-primary"><Plus size={16} />Add Battery</Link>
      </div>

      <div className="demo-banner" style={{ marginBottom: '1rem' }}>
        ⚠ DEMO DATA — These are simulated batteries. Not real-world validated measurements.
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input-field" placeholder="Search by ID, manufacturer..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select className="input-field" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ flex: '0 0 auto', width: 160 }}>
          <option value="">All Risk Levels</option>
          <option value="LOW">LOW</option>
          <option value="MODERATE">MODERATE</option>
          <option value="HIGH">HIGH</option>
        </select>
        <select className="input-field" value={filterChemistry} onChange={e => setFilterChemistry(e.target.value)} style={{ flex: '0 0 auto', width: 180 }}>
          <option value="">All Chemistries</option>
          {CHEMISTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-secondary" onClick={load} style={{ flex: '0 0 auto' }}>
          <Filter size={15} />Apply
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
            <div className="spinner" />Loading batteries...
          </div>
        ) : batteries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Battery size={48} style={{ color: 'var(--color-border)', margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No batteries found</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Try adjusting your search or filters</div>
            <Link to="/batteries/add" className="btn-primary"><Plus size={16} />Add First Battery</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Battery ID</th>
                  <th>Manufacturer</th>
                  <th>Chemistry</th>
                  <th>Capacity</th>
                  <th>Cycle Count</th>
                  <th>SOH</th>
                  <th>Risk</th>
                  <th>Second-Life</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batteries.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '0.8125rem', color: 'var(--color-accent)', background: 'var(--color-accent-subtle)', padding: '0.125rem 0.5rem', borderRadius: 4 }}>{b.battery_id}</code>
                        {b.is_demo && <span className="badge badge-muted" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>DEMO</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{b.manufacturer || '—'}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{b.chemistry || '—'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {b.rated_capacity_ah ? `${b.rated_capacity_ah} Ah` : '—'}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {b.cycle_count?.toLocaleString() || '0'}
                    </td>
                    <td>
                      {b.latest_soh != null ? (
                        <span style={{ fontWeight: 700, color: getSOHColor(b.latest_soh), fontSize: '0.9375rem' }}>
                          {b.latest_soh.toFixed(1)}%
                        </span>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>No analysis</span>}
                    </td>
                    <td><RiskBadge risk={b.latest_risk} size="sm" /></td>
                    <td>
                      {b.latest_second_life ? (
                        <span className={getSecondLifeBadgeClass(b.latest_second_life)} style={{ fontSize: '0.7rem' }}>
                          {b.latest_second_life}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '0.7rem' }}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/batteries/${b.battery_id}`} className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
