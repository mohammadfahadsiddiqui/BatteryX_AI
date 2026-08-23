// BatteryX AI – Hardware Center Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Plus, Wifi, RefreshCw, Server, CheckCircle, XCircle } from 'lucide-react';
import { hardwareApi, batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { HardwareDevice, Battery } from '../../types';

export function HardwareCenterPage() {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state for new device registration
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('ESP32');
  const [newConn, setNewConn] = useState('WiFi');
  const [assignedBattery, setAssignedBattery] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devs, batts] = await Promise.all([hardwareApi.list(), batteryApi.list()]);
      setDevices(devs);
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
      const res = await hardwareApi.register({
        device_id: newDeviceId,
        name: newName,
        device_type: newType,
        connection_type: newConn,
      });
      if (assignedBattery) {
        await hardwareApi.assign(res.device_id, assignedBattery);
      }
      setCreatedToken(res.auth_token || 'Generated and saved');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register hardware device');
    }
  };

  const getBatteryName = (bId?: string) => {
    if (!bId) return 'Unassigned';
    const found = batteries.find((b) => b.id === bId || b.battery_id === bId);
    return found ? `${found.battery_id} (${found.manufacturer || 'Pack'})` : bId;
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            Hardware & Edge Gateway Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Manage ESP32 sensor nodes, industrial IoT gateways, and BMS CAN interface units.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button onClick={() => { setShowModal(true); setCreatedToken(null); }} className="btn-primary">
            <Plus size={16} />
            Register Device
          </button>
        </div>
      </div>

      {/* Device Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Total Devices</span>
            <Server size={18} color="#66CC99" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {devices.length}
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Active Streaming</span>
            <CheckCircle size={18} color="#4DBF88" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4DBF88', marginTop: '0.5rem' }}>
            {devices.filter((d) => d.status === 'CONNECTED' || d.status === 'MEASURING').length}
          </div>
        </div>

        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Offline / Standby</span>
            <XCircle size={18} color="#8B949C" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8B949C', marginTop: '0.5rem' }}>
            {devices.filter((d) => d.status === 'OFFLINE').length}
          </div>
        </div>
      </div>

      {/* Device Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Device ID & Name</th>
              <th>Type</th>
              <th>Connection</th>
              <th>Assigned Battery</th>
              <th>Status</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading hardware devices...</td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
                  No hardware devices registered yet. Click "Register Device" to provision an ESP32 or BMS Gateway.
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#3F4A56' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B949C', fontFamily: 'monospace' }}>{d.device_id}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{d.device_type}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                      <Wifi size={14} color="#68737D" />
                      {d.connection_type}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: d.battery_id ? '#3F4A56' : '#8B949C' }}>
                      {getBatteryName(d.battery_id)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={d.status} type="device" size="sm" />
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#68737D' }}>
                    {d.last_seen ? new Date(d.last_seen).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    <Link to={`/hardware/${d.device_id}`} className="btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#3F4A56' }}>
              Register Hardware Device
            </h2>

            {createdToken ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(102,204,153,0.12)', border: '1px solid #66CC99', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#4DBF88', marginBottom: '0.25rem' }}>Device Successfully Registered!</div>
                  <p style={{ fontSize: '0.8125rem', color: '#3F4A56' }}>
                    Copy this device authentication token now. Flash it into your ESP32 <code>config.h</code>:
                  </p>
                  <div style={{
                    marginTop: '0.5rem', padding: '0.5rem', background: '#FFFFFF',
                    border: '1px solid #E2E8E5', borderRadius: '6px', fontFamily: 'monospace',
                    fontSize: '0.8125rem', wordBreak: 'break-all', userSelect: 'all',
                  }}>
                    {createdToken}
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">Device Identifier (Unique ID)</label>
                  <input
                    required
                    placeholder="e.g. ESP32-LAB-NODE-01"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Display Name</label>
                  <input
                    required
                    placeholder="e.g. Lab Bench 1 Pack Monitor"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label">Device Type</label>
                    <select value={newType} onChange={(e) => setNewType(e.target.value)} className="input-field">
                      <option value="ESP32">ESP32 Sensor Node</option>
                      <option value="Raspberry Pi">Raspberry Pi Gateway</option>
                      <option value="BMS Gateway">BMS CAN Gateway</option>
                      <option value="Industrial Gateway">Industrial Edge Box</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Connection</label>
                    <select value={newConn} onChange={(e) => setNewConn(e.target.value)} className="input-field">
                      <option value="WiFi">Wi-Fi (802.11 b/g/n)</option>
                      <option value="Ethernet">Ethernet / RJ45</option>
                      <option value="Cellular (4G/LTE)">Cellular 4G/LTE</option>
                      <option value="CAN Bus">CAN Bus Direct</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Assign to Battery (Optional)</label>
                  <select value={assignedBattery} onChange={(e) => setAssignedBattery(e.target.value)} className="input-field">
                    <option value="">-- Leave Unassigned --</option>
                    {batteries.map((b) => (
                      <option key={b.id} value={b.battery_id}>
                        {b.battery_id} ({b.manufacturer || 'EV Pack'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Register & Generate Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
