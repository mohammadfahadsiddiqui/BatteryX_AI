// BatteryX AI – BMS Manager Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Plus, Shield, RefreshCw, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { bmsApi, batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { BMSDevice, Battery } from '../../types';

export function BMSManagerPage() {
  const [bmsDevices, setBmsDevices] = useState<BMSDevice[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newBmsId, setNewBmsId] = useState('');
  const [newName, setNewName] = useState('');
  const [newMfg, setNewMfg] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newProtocol, setNewProtocol] = useState('CAN (500 kbps)');
  const [targetBattery, setTargetBattery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [devs, batts] = await Promise.all([bmsApi.listDevices(), batteryApi.list()]);
      setBmsDevices(devs);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bmsApi.register({
        bms_id: newBmsId,
        name: newName,
        manufacturer: newMfg,
        model: newModel,
        protocol: newProtocol,
        battery_id: targetBattery || undefined,
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register BMS device');
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            BMS & CAN Management
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            BMS hardware adapters, CAN matrix decoders, contactor states, and protection diagnostics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Add BMS Device
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div style={{
        padding: '0.875rem 1rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(0,155,255,0.08)',
        border: '1px solid rgba(0,155,255,0.25)',
        fontSize: '0.8125rem',
        color: '#0088CC',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <Shield size={20} />
        <div>
          <strong>SAFETY ARCHITECTURE NOTE:</strong> BatteryX AI functions as a supervisory intelligence layer.
          Primary electrical safety (over-voltage, short-circuit, thermal cutoff) is autonomously managed by the physical BMS hardware.
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Connected BMS Nodes</span>
            <Cpu size={18} color="#66CC99" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {bmsDevices.length}
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">CAN Bus Matrix Protocols</span>
            <Zap size={18} color="#C89800" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            Standard & Custom
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Protection Status</span>
            <CheckCircle size={18} color="#4DBF88" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4DBF88', marginTop: '0.5rem' }}>
            Nominal
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>BMS Identifier</th>
              <th>Name & Model</th>
              <th>Protocol / Interface</th>
              <th>Target Battery</th>
              <th>Status</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading BMS devices...</td></tr>
            ) : bmsDevices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
                  No BMS devices configured. Click "Add BMS Device" to register a CAN or Modbus adapter.
                </td>
              </tr>
            ) : (
              bmsDevices.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#3F4A56', fontFamily: 'monospace' }}>{b.bms_id}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B949C' }}>
                      {b.manufacturer || 'Generic'} {b.model || ''}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{b.protocol || 'CAN Bus'}</td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                      {b.battery_id_str || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={b.status} type="device" size="sm" />
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#68737D' }}>
                    {b.last_seen ? new Date(b.last_seen).toLocaleString() : 'Standby'}
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
              Register BMS CAN Device
            </h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">BMS Unit Identifier</label>
                <input required placeholder="e.g. BMS-CAN-NODE-01" value={newBmsId} onChange={(e) => setNewBmsId(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Display Name</label>
                <input required placeholder="e.g. Main Pack BMS Master" value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Manufacturer</label>
                  <input placeholder="e.g. Orion / Daly / Generic" value={newMfg} onChange={(e) => setNewMfg(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">Protocol</label>
                  <select value={newProtocol} onChange={(e) => setNewProtocol(e.target.value)} className="input-field">
                    <option value="CAN (500 kbps)">CAN Bus (500 kbps)</option>
                    <option value="CAN (250 kbps)">CAN Bus (250 kbps)</option>
                    <option value="Modbus RTU">Modbus RTU</option>
                    <option value="UART Direct">UART Direct</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Assign to Battery</label>
                <select value={targetBattery} onChange={(e) => setTargetBattery(e.target.value)} className="input-field">
                  <option value="">-- Leave Unassigned --</option>
                  {batteries.map((b) => (
                    <option key={b.id} value={b.battery_id}>{b.battery_id} ({b.manufacturer})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Register BMS</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
