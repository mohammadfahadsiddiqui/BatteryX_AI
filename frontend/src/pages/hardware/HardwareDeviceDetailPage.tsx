// BatteryX AI – Hardware Device Detail Page
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Wifi, Activity, Battery, RefreshCw, Power } from 'lucide-react';
import { hardwareApi, batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { HardwareDevice, DeviceEvent, Battery as BatteryType } from '../../types';

export function HardwareDeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<HardwareDevice | null>(null);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [batteries, setBatteries] = useState<BatteryType[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [dev, evts, batts] = await Promise.all([
        hardwareApi.get(id),
        hardwareApi.getEvents(id),
        batteryApi.list(),
      ]);
      setDevice(dev);
      setEvents(evts);
      setBatteries(batts);
      if (dev.battery_id) {
        setSelectedBattery(dev.battery_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAssign = async () => {
    if (!device || !selectedBattery) return;
    try {
      await hardwareApi.assign(device.device_id, selectedBattery);
      alert('Assigned successfully');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleDeactivate = async () => {
    if (!device || !confirm(`Deactivate device ${device.device_id}?`)) return;
    try {
      await hardwareApi.deactivate(device.device_id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Deactivation failed');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading hardware device details...</div>;
  }

  if (!device) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Device not found.</div>;
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/hardware" className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56' }}>{device.name}</h1>
              <StatusBadge status={device.status} type="device" />
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#8B949C', fontFamily: 'monospace' }}>
              ID: {device.device_id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={handleDeactivate} className="btn-danger">
            <Power size={16} /> Deactivate
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Device Info & Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56', marginBottom: '1rem' }}>
              Hardware Configuration & Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <div className="label">Device Type</div>
                <div style={{ fontWeight: 600 }}>{device.device_type}</div>
              </div>
              <div>
                <div className="label">Connection Mode</div>
                <div style={{ fontWeight: 600 }}>{device.connection_type}</div>
              </div>
              <div>
                <div className="label">Firmware Version</div>
                <div style={{ fontWeight: 600 }}>{device.firmware_version || 'v1.0.0-rc'}</div>
              </div>
              <div>
                <div className="label">Sampling Rate</div>
                <div style={{ fontWeight: 600 }}>{device.telemetry_rate_hz} Hz (1.0s packet interval)</div>
              </div>
              <div>
                <div className="label">Last Heartbeat</div>
                <div style={{ fontWeight: 600 }}>
                  {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                </div>
              </div>
              <div>
                <div className="label">Provisioned Date</div>
                <div style={{ fontWeight: 600 }}>{new Date(device.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8E5' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56' }}>Device Event Audit Stream</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#8B949C' }}>
                      No logged events for this device yet.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: '0.8125rem' }}>{new Date(e.timestamp).toLocaleString()}</td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{e.event_type}</span>
                      </td>
                      <td>
                        <StatusBadge status={e.severity} type="alert" size="sm" />
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{e.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Battery Assignment Side Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56', marginBottom: '0.75rem' }}>
              Battery Target Binding
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#8B949C', marginBottom: '1rem' }}>
              Associate this edge sensor or CAN bridge with a registered battery pack.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Select Target Battery</label>
              <select
                value={selectedBattery}
                onChange={(e) => setSelectedBattery(e.target.value)}
                className="input-field"
              >
                <option value="">-- Unassigned --</option>
                {batteries.map((b) => (
                  <option key={b.id} value={b.battery_id}>
                    {b.battery_id} ({b.manufacturer || 'Pack'})
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleAssign} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Save Target Binding
            </button>
          </div>

          <div className="card" style={{ background: 'rgba(102,204,153,0.06)', border: '1px solid rgba(102,204,153,0.3)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4DBF88', marginBottom: '0.5rem' }}>
              Firmware Setup Instructions
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#3F4A56', lineHeight: 1.5 }}>
              1. Open <code>firmware/main/config.h</code> in PlatformIO.<br />
              2. Set <code>DEVICE_ID = "{device.device_id}"</code>.<br />
              3. Set <code>SERVER_HOST</code> to your BatteryX endpoint.<br />
              4. Flash ESP32 over USB and monitor Serial terminal at 115200 baud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
