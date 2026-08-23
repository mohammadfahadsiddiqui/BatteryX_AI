// BatteryX AI – Battery Lifecycle Page
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, Calendar, Award, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { lifecycleApi, batteryApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Battery, BatteryLifecycleEvent } from '../../types';

export function LifecyclePage() {
  const [searchParams] = useSearchParams();
  const initialBatt = searchParams.get('battery') || '';

  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(initialBatt);
  const [events, setEvents] = useState<BatteryLifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    batteryApi.list().then((batts) => {
      setBatteries(batts);
      if (!selectedBatteryId && batts.length > 0) {
        setSelectedBatteryId(batts[0].battery_id);
      }
    });
  }, []);

  const loadTimeline = async () => {
    if (!selectedBatteryId) return;
    setLoading(true);
    try {
      const res = await lifecycleApi.getEvents(selectedBatteryId);
      setEvents(res.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [selectedBatteryId]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            Battery Lifecycle & Provenance Timeline
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Track end-to-end historical events: manufacturing, fleet deployment, SOH tests, recertification, and second-life.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedBatteryId}
            onChange={(e) => setSelectedBatteryId(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            {batteries.map((b) => (
              <option key={b.id} value={b.battery_id}>
                {b.battery_id} ({b.manufacturer})
              </option>
            ))}
          </select>
          <button onClick={loadTimeline} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Timeline view */}
      <div className="card" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#8B949C' }}>Loading lifecycle history...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
            No lifecycle events logged for battery {selectedBatteryId}. Run a diagnostic test to generate a lifecycle record.
          </div>
        ) : (
          <div style={{ position: 'relative', borderLeft: '2px solid #E2E8E5', marginLeft: '1rem', paddingLeft: '1.5rem' }}>
            {events.map((evt, idx) => (
              <div key={evt.id} style={{ marginBottom: '2rem', position: 'relative' }}>
                {/* Timeline node icon */}
                <div style={{
                  position: 'absolute',
                  left: '-2.15rem',
                  top: '0',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#66CC99',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 0 0 2px #66CC99',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56' }}>{evt.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>{evt.description}</p>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8B949C', fontWeight: 500 }}>
                    {new Date(evt.event_date).toLocaleString()}
                  </div>
                </div>

                {(evt.soh_at_event !== undefined || evt.risk_at_event) && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    {evt.soh_at_event !== undefined && (
                      <span className="badge badge-success">SOH: {evt.soh_at_event.toFixed(1)}%</span>
                    )}
                    {evt.risk_at_event && (
                      <StatusBadge status={evt.risk_at_event} type="risk" size="sm" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
