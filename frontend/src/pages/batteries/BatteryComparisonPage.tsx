// BatteryX AI – Battery Multi-Pack Comparison Page
import { useState, useEffect } from 'react';
import { Columns, RefreshCw, CheckSquare } from 'lucide-react';
import { batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import type { Battery } from '../../types';

export function BatteryComparisonPage() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await batteryApi.list();
      setBatteries(list);
      // Select first 3 by default
      if (selectedIds.length === 0 && list.length > 0) {
        setSelectedIds(list.slice(0, 3).map((b) => b.battery_id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((x) => x !== id));
      }
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, id]);
      } else {
        alert('You can compare up to 5 battery packs simultaneously.');
      }
    }
  };

  const comparedBatteries = batteries.filter((b) => selectedIds.includes(b.battery_id));

  const chartData = comparedBatteries.map((b) => ({
    name: b.battery_id,
    soh: b.latest_soh || 90,
    cycles: b.cycle_count || 100,
  }));

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Columns size={22} color="#66CC99" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
              Multi-Pack Benchmark & Comparison
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Side-by-side comparative diagnostics, degradation variance, and second-life viability benchmarking.
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Battery Selector Pills */}
      <div className="card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#68737D', marginRight: '0.5rem' }}>
          Select Packs to Compare:
        </span>
        {batteries.map((b) => {
          const isSel = selectedIds.includes(b.battery_id);
          return (
            <button
              key={b.id}
              onClick={() => toggleSelect(b.battery_id)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${isSel ? '#66CC99' : '#E2E8E5'}`,
                background: isSel ? 'rgba(102,204,153,0.15)' : '#F7F9F8',
                color: isSel ? '#2E9F68' : '#68737D',
              }}
            >
              {b.battery_id}
            </button>
          );
        })}
      </div>

      {/* SOH Bar Comparison Chart */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56', marginBottom: '1rem' }}>
          State of Health (%) Comparison Benchmark
        </h3>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" vertical={false} />
              <XAxis dataKey="name" stroke="#8B949C" />
              <YAxis domain={[0, 100]} stroke="#8B949C" unit="%" />
              <Tooltip />
              <Bar dataKey="soh" name="SOH (%)" fill="#66CC99" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Metric / Parameter</th>
              {comparedBatteries.map((b) => (
                <th key={b.id} style={{ minWidth: '150px' }}>{b.battery_id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>Manufacturer & Model</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>{b.manufacturer} {b.model}</td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Cell Chemistry</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>{b.chemistry || 'Li-ion NMC'}</td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Rated Capacity & Voltage</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>{b.rated_capacity_ah || 100} Ah / {b.rated_voltage_v || 400} V</td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Current SOH (%)</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>
                  <span style={{ fontWeight: 700, color: (b.latest_soh || 90) > 80 ? '#4DBF88' : '#FBC000' }}>
                    {b.latest_soh ? `${b.latest_soh.toFixed(1)}%` : '—'}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Est. Remaining Useful Life</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>{b.latest_rul ? `${b.latest_rul} yrs` : '—'}</td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Cycle Count</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>{b.cycle_count || 0} cycles</td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Safety Risk</td>
              {comparedBatteries.map((b) => (
                <td key={b.id}>
                  {b.latest_risk ? <StatusBadge status={b.latest_risk} type="risk" size="sm" /> : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Second-Life Classification</td>
              {comparedBatteries.map((b) => (
                <td key={b.id} style={{ fontSize: '0.8125rem' }}>{b.latest_second_life || 'Pending'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
