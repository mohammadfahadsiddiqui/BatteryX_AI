// BatteryX AI – Live Telemetry Monitor Page
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Zap, Thermometer, Play, Pause } from 'lucide-react';
import { batteryApi, demoApi, telemetryApi } from '../services/api';
import { BatteryWebSocket, createTelemetryPoller } from '../services/websocket';
import { LiveChart, DataPoint } from '../components/charts/LiveChart';
import { CellVoltageGrid } from '../components/charts/CellVoltageGrid';
import { LiveIndicator } from '../components/ui/LiveIndicator';
import { DataSourceBadge } from '../components/ui/DataSourceBadge';
import { AlertBanner } from '../components/ui/AlertBanner';
import type { Battery, LiveTelemetry, BatteryAlert } from '../types';

export function LiveMonitorPage() {
  const [searchParams] = useSearchParams();
  const initialBatteryId = searchParams.get('battery') || '';

  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState(initialBatteryId);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoScenario, setDemoScenario] = useState('healthy');
  const [demoScenarios, setDemoScenarios] = useState<Array<{ key: string; label: string }>>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [latestPacket, setLatestPacket] = useState<LiveTelemetry | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<BatteryAlert[]>([]);

  const [voltageSeries, setVoltageSeries] = useState<DataPoint[]>([]);
  const [currentSeries, setCurrentSeries] = useState<DataPoint[]>([]);
  const [tempSeries, setTempSeries] = useState<DataPoint[]>([]);
  const [socSeries, setSocSeries] = useState<DataPoint[]>([]);
  const [powerSeries, setPowerSeries] = useState<DataPoint[]>([]);

  const tickRef = useRef(0);
  const wsRef = useRef<BatteryWebSocket | null>(null);
  const pollStopRef = useRef<(() => void) | null>(null);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      batteryApi.list(),
      demoApi.getScenarios(),
    ]).then(([list, scenarios]) => {
      if (!mounted) return;
      setBatteries(list);
      setDemoScenarios(scenarios);
      if (!selectedBatteryId && list.length) setSelectedBatteryId(list[0].battery_id);
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedBatteryId) {
      setSelectedBattery(null);
      return;
    }
    const found = batteries.find((x) => x.battery_id === selectedBatteryId || x.id === selectedBatteryId);
    setSelectedBattery(found || null);
  }, [selectedBatteryId, batteries]);

  const handleNewPacket = useCallback((pkt: LiveTelemetry) => {
    if (isPaused) return;
    setLatestPacket(pkt);
    // A successful telemetry packet means the monitor is receiving live data,
    // regardless of whether transport is WebSocket or HTTP polling.
    if (!isDemoMode) setIsLiveConnected(true);
    const timeStr = new Date(pkt.timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const pushPoint = (prev: DataPoint[], val: number | undefined, key: string) => {
      if (val == null || Number.isNaN(val)) return prev;
      return [...prev, { time: timeStr, [key]: val }].slice(-40);
    };
    setVoltageSeries(prev => pushPoint(prev, pkt.voltage_v, 'voltage'));
    setCurrentSeries(prev => pushPoint(prev, pkt.current_a, 'current'));
    setTempSeries(prev => pushPoint(prev, pkt.temperature_c, 'temperature'));
    setSocSeries(prev => pushPoint(prev, pkt.soc_pct, 'soc'));
    setPowerSeries(prev => pushPoint(prev, pkt.power_w, 'power'));
  }, [isPaused, isDemoMode]);

  useEffect(() => {
    if (!selectedBatteryId) return;

    setVoltageSeries([]);
    setCurrentSeries([]);
    setTempSeries([]);
    setSocSeries([]);
    setPowerSeries([]);
    setLatestPacket(null);
    setActiveAlerts([]);
    tickRef.current = 0;
    setIsLiveConnected(false);

    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    if (pollStopRef.current) {
      pollStopRef.current();
      pollStopRef.current = null;
    }
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }

    if (isDemoMode) {
      setIsLiveConnected(false);
      const runDemoTick = async () => {
        try {
          const pkt = await demoApi.getTelemetry(selectedBatteryId, demoScenario, tickRef.current++);
          handleNewPacket(pkt);
        } catch (error) {
          console.error('Demo telemetry failed', error);
        }
      };
      void runDemoTick();
      demoTimerRef.current = setInterval(() => { void runDemoTick(); }, 1500);
      return () => {
        if (demoTimerRef.current) clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
      };
    }

    // Vercel serverless deployments do not provide persistent WebSockets.
    // Use the HTTP telemetry stream as the production live transport. A
    // WebSocket is still supported automatically when explicitly enabled.
    const useWebSocket = import.meta.env.VITE_ENABLE_WEBSOCKET === 'true';

    if (!useWebSocket) {
      pollStopRef.current = createTelemetryPoller(selectedBatteryId, handleNewPacket, 2000);
      telemetryApi.getLatest(selectedBatteryId).then((pkt) => {
        if (pkt) handleNewPacket(pkt);
      }).catch(console.error);
      return () => {
        if (pollStopRef.current) pollStopRef.current();
        pollStopRef.current = null;
      };
    }

    const ws = new BatteryWebSocket(selectedBatteryId);
    wsRef.current = ws;
    ws.onConnected = () => setIsLiveConnected(true);
    ws.onDisconnected = () => {
      setIsLiveConnected(false);
      if (!pollStopRef.current) {
        pollStopRef.current = createTelemetryPoller(selectedBatteryId, handleNewPacket, 2000);
      }
    };
    ws.onTelemetry = handleNewPacket;
    ws.onAlert = (alert) => setActiveAlerts(prev => [alert, ...prev].slice(0, 5));
    ws.connect();

    telemetryApi.getLatest(selectedBatteryId).then((pkt) => {
      if (pkt) handleNewPacket(pkt);
    }).catch(console.error);

    return () => {
      ws.disconnect();
      if (pollStopRef.current) pollStopRef.current();
      pollStopRef.current = null;
    };
  }, [selectedBatteryId, isDemoMode, demoScenario, handleNewPacket]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56' }}>Live Telemetry Monitor</h1>
            <LiveIndicator isLive={isLiveConnected} isDemo={isDemoMode} />
          </div>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Real-time telemetry, hardware status, alerts and battery diagnostics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={selectedBatteryId} onChange={(e) => setSelectedBatteryId(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '180px' }}>
            {batteries.map((b) => <option key={b.id} value={b.battery_id}>{b.battery_id} ({b.manufacturer || 'EV Pack'})</option>)}
          </select>

          <div style={{ display: 'flex', background: '#F7F9F8', border: '1px solid #E2E8E5', borderRadius: 8, padding: 3 }}>
            <button type="button" onClick={() => setIsDemoMode(false)} style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: 0, background: !isDemoMode ? '#66CC99' : 'transparent', color: !isDemoMode ? '#fff' : '#8B949C', cursor: 'pointer' }}>Hardware Stream</button>
            <button type="button" onClick={() => setIsDemoMode(true)} style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: 0, background: isDemoMode ? '#FBC000' : 'transparent', color: isDemoMode ? '#3F4A56' : '#8B949C', cursor: 'pointer' }}>Demo Simulation</button>
          </div>

          {isDemoMode && (
            <select value={demoScenario} onChange={(e) => setDemoScenario(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 160 }}>
              {demoScenarios.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}

          <button type="button" onClick={() => setIsPaused(v => !v)} className="btn-secondary">
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeAlerts.map((alert) => <AlertBanner key={alert.alert_id} alert={alert} />)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.875rem' }}>
        {([
          ['Voltage', latestPacket?.voltage_v != null ? `${latestPacket.voltage_v.toFixed(1)} V` : '—', Zap],
          ['Current', latestPacket?.current_a != null ? `${latestPacket.current_a.toFixed(1)} A` : '—', Activity],
          ['Temperature', latestPacket?.temperature_c != null ? `${latestPacket.temperature_c.toFixed(1)} °C` : '—', Thermometer],
          ['SOC', latestPacket?.soc_pct != null ? `${latestPacket.soc_pct.toFixed(1)}%` : '—', Activity],
          ['Power', latestPacket?.power_w != null ? `${latestPacket.power_w.toFixed(0)} W` : '—', Zap],
        ] as any[]).map(([label, value, Icon]) => (
          <div key={label} className="card metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="section-title">{label}</span>
              <Icon size={17} color="#66CC99" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3F4A56', marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#3F4A56' }}>{selectedBattery?.battery_id || selectedBatteryId || 'No battery selected'}</div>
          <div style={{ color: '#68737D', fontSize: '0.8rem', marginTop: 3 }}>
            Source: <DataSourceBadge source={latestPacket?.source || (isDemoMode ? 'demo' : 'esp32')} />
            {' '}• Last update: {latestPacket?.timestamp ? new Date(latestPacket.timestamp).toLocaleTimeString() : '—'}
          </div>
        </div>
        <div style={{ color: isLiveConnected ? '#4DBF88' : '#8B949C', fontWeight: 600, fontSize: '0.8rem' }}>
          {isDemoMode ? 'SIMULATION' : isLiveConnected ? (import.meta.env.VITE_ENABLE_WEBSOCKET === 'true' ? 'LIVE CONNECTION' : 'LIVE POLLING') : 'WAITING FOR TELEMETRY'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card"><div className="section-title" style={{ marginBottom: 8 }}>Voltage</div><LiveChart data={voltageSeries} dataKey="voltage" label="Voltage (V)" /></div>
        <div className="card"><div className="section-title" style={{ marginBottom: 8 }}>Current</div><LiveChart data={currentSeries} dataKey="current" label="Current (A)" /></div>
        <div className="card"><div className="section-title" style={{ marginBottom: 8 }}>Temperature</div><LiveChart data={tempSeries} dataKey="temperature" label="Temperature (°C)" /></div>
        <div className="card"><div className="section-title" style={{ marginBottom: 8 }}>SOC</div><LiveChart data={socSeries} dataKey="soc" label="SOC (%)" /></div>
      </div>

      {latestPacket?.cell_voltages && latestPacket.cell_voltages.length > 1 && (
        <div className="card"><div className="section-title" style={{ marginBottom: 10 }}>Cell Voltage Monitoring</div><CellVoltageGrid cellVoltages={latestPacket.cell_voltages} /></div>
      )}
    </div>
  );
}
