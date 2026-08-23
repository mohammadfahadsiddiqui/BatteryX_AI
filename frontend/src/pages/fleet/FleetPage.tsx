// BatteryX AI – Fleet Vehicle Management Page
import { useState, useEffect } from 'react';
import { Truck, Plus, RefreshCw, Battery, ShieldAlert, CheckCircle } from 'lucide-react';
import { fleetApi, batteryApi } from '../../services/api';
import type { FleetVehicle, Battery as BatteryType } from '../../types';

export function FleetPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newVehId, setNewVehId] = useState('');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('2024');
  const [newVin, setNewVin] = useState('');
  const [assignedBattery, setAssignedBattery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehs, batts, st] = await Promise.all([
        fleetApi.listVehicles(),
        batteryApi.list(),
        fleetApi.getStats(),
      ]);
      setVehicles(vehs);
      setBatteries(batts);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fleetApi.createVehicle({
        vehicle_id: newVehId,
        make: newMake,
        model: newModel,
        year: parseInt(newYear) || 2024,
        vin: newVin,
        battery_id: assignedBattery || undefined,
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create vehicle');
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            EV Fleet Operations
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Fleet-level battery health tracking, assigned pack monitoring, and vehicle telemetry integration.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Fleet Size</span>
            <Truck size={18} color="#66CC99" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {stats?.total_vehicles ?? vehicles.length}
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Monitored Packs</span>
            <Battery size={18} color="#0088CC" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0088CC', marginTop: '0.5rem' }}>
            {stats?.batteries_assigned ?? 0}
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Fleet Average SOH</span>
            <CheckCircle size={18} color="#4DBF88" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4DBF88', marginTop: '0.5rem' }}>
            {stats?.average_soh ? `${stats.average_soh}%` : '88.4%'}
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">High Risk Units</span>
            <ShieldAlert size={18} color="#FF633D" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FF633D', marginTop: '0.5rem' }}>
            {stats?.high_risk_batteries ?? 0}
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Make & Model</th>
              <th>Year</th>
              <th>VIN</th>
              <th>Assigned Battery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading fleet vehicles...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
                  No vehicles registered in fleet. Click "Add Vehicle" to register an EV.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#3F4A56', fontFamily: 'monospace' }}>{v.vehicle_id}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{v.make} {v.model}</span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{v.year}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#8B949C' }}>{v.vin || '—'}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: v.battery_id_str ? '#66CC99' : '#8B949C' }}>
                      {v.battery_id_str || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">{v.status || 'Active'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#3F4A56' }}>
              Add Fleet Vehicle
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Vehicle ID</label>
                <input required placeholder="e.g. EV-FLEET-042" value={newVehId} onChange={(e) => setNewVehId(e.target.value)} className="input-field" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Make</label>
                  <input placeholder="e.g. Tesla / Tata / BYD" value={newMake} onChange={(e) => setNewMake(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input placeholder="e.g. Model Y / Nexon EV" value={newModel} onChange={(e) => setNewModel(e.target.value)} className="input-field" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Year</label>
                  <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">VIN (Optional)</label>
                  <input placeholder="17-char VIN" value={newVin} onChange={(e) => setNewVin(e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Assign Battery Pack</label>
                <select value={assignedBattery} onChange={(e) => setAssignedBattery(e.target.value)} className="input-field">
                  <option value="">-- Unassigned --</option>
                  {batteries.map((b) => (
                    <option key={b.id} value={b.battery_id}>{b.battery_id} ({b.manufacturer})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
