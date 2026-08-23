// BatteryX AI – Live Telemetry Monitor Page
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity, Zap, Gauge, Thermometer, Battery as BatteryIcon,
  Play, Pause, RefreshCw, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { batteryApi, demoApi, telemetryApi } from '../services/api';
import { BatteryWebSocket } from '../services/websocket';
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
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(initialBatteryId);
  const [selectedBattery, setSelectedBattery] = useState<Battery | null>(null);

  // Connection & mode state
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [demoScenario, setDemoScenario] = useState<string>('healthy');
  const [demoScenarios, setDemoScenarios] = useState<Array<{ key: string; label: string }>>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Real-time telemetry data
  const [latestPacket, setLatestPacket] = useState<LiveTelemetry | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<BatteryAlert[]>([]);

  // Time-series chart buffers (window of 40 points)
  const [voltageSeries, setVoltageSeries] = useState<DataPoint[]>([]);
  const [currentSeries, setCurrentSeries] = useState<DataPoint[]>([]);
  const [tempSeries, setTempSeries] = useState<DataPoint[]>([]);
  const [socSeries, setSocSeries] = useState<DataPoint[]>([]);
  const [powerSeries, setPowerSeries] = useState<DataPoint[]>([]);

  const tickRef = useRef<number>(0);
  const wsRef = useRef<BatteryWebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load initial battery list and demo scenarios
  useEffect(() => {
    batteryApi.list().then((list) => {
      setBatteries(list);
      if (!selectedBatteryId && list.length > 0) {
        setSelectedBatteryId(list[0].battery_id);
      }
    }).catch(console.error);

    demoApi.getScenarios().then(setDemoScenarios).catch(console.error);
  }, []);

  // Update selected battery object
  useEffect(() => {
    if (selectedBatteryId && batteries.length > 0) {
      const b = batteries.find((x) => x.battery_id === selectedBatteryId || x.id === selectedBatteryId);
      setSelectedBattery(b || null);
    }
  }, [selectedBatteryId, batteries]);

  // Handle incoming telemetry point (both from WS and Demo Generator)
  const handleNewPacket = (pkt: LiveTelemetry) => {
    if (isPaused) return;

    setLatestPacket(pkt);

    const timeStr = new Date(pkt.timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const pushPoint = (prev: DataPoint[], val: number | undefined, key: string): DataPoint[] => {
      if (val === undefined || val === null) return prev;
      const next = [...prev, { time: timeStr, [key]: val }];
      return next.slice(-40); // keep last 40 points
    };

    setVoltageSeries((prev) => pushPoint(prev, pkt.voltage_v, 'voltage'));
    setCurrentSeries((prev) => pushPoint(prev, pkt.current_a, 'current'));
    setTempSeries((prev) => pushPoint(prev, pkt.temperature_c, 'temperature'));
    setSocSeries((prev) => pushPoint(prev, pkt.soc_pct, 'soc'));
    setPowerSeries((prev) => pushPoint(prev, pkt.power_w, 'power'));
  };

  // Demo generator loop or WebSocket connection
  useEffect(() => {
    if (!selectedBatteryId) return;

    // Reset series when battery or mode changes
    setVoltageSeries([]);
    setCurrentSeries([]);
    setTempSeries([]);
    setSocSeries([]);
    setPowerSeries([]);
    tickRef.current = 0;

    if (isDemoMode) {
      // Demo loop
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      setIsLiveConnected(false);

      const runDemoTick = async () => {
        try {
          const pkt = await demoApi.getTelemetry(
            selectedBatteryId,
            demoScenario,
            tickRef.current++
          );
          handleNewPacket(pkt);
        } catch (e) {
          console.error('Demo tick failed', e);
        }
      };

      runDemoTick();
      const interval = setInterval(runDemoTick, 1500);
      timerRef.current = interval;

      return () => clearInterval(interval);
    } else {
      // Real Hardware WebSocket
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const ws = new BatteryWebSocket(selectedBatteryId);
      wsRef.current = ws;

      ws.onConnected = () => setIsLiveConnected(true);
      ws.onDisconnected = () => setIsLiveConnected(false);
      ws.onTelemetry = (pkt) => handleNewPacket(pkt);
      ws.onAlert = (alert) => setActiveAlerts((prev) => [alert, ...prev.slice(0, 4)]);

      ws.connect();

      // Also fetch latest snapshot from REST API
      telemetryApi.getLatest(selectedBatteryId).then((pkt) => {
        if (pkt) handleNewPacket(pkt);
      }).catch(console.error);

      return () => {
        ws.disconnect();
      };
    }
  }, [selectedBatteryId, isDemoMode, demoScenario, isPaused]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Battery Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
              Live Telemetry Monitor
            </h1>
            <LiveIndicator isLive={isLiveConnected} isDemo={isDemoMode} />
          </div>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Real-time streaming telemetry, high-frequency charts, and cell-level diagnostic telemetry.
          </p>
        </div>

        {/* Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Battery Dropdown */}
          <select
            value={selectedBatteryId}
            onChange={(e) => setSelectedBatteryId(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            {batteries.map((b) => (
              <option key={b.id} value={b.battery_id}>
                {b.battery_id} ({b.manufacturer || 'EV Pack'})
              </option>
            ))}
          </select>

          {/* Mode Switch: Demo vs Live Hardware */}
          <div style={{ display: 'flex', background: '#F7F9F8', border: '1px solid #E2E8E5', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setIsDemoMode(true)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: isDemoMode ? '#FFFFFF' : 'transparent',
                color: isDemoMode ? '#3F4A56' : '#8B949C',
                boxShadow: isDemoMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Demo Simulation
            </button>
            <button
              onClick={() => setIsDemoMode(false)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: !isDemoMode ? '#66CC99' : 'transparent',
                color: !isDemoMode ? '#FFFFFF' : '#8B949C',
                boxShadow: !isDemoMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Hardware Stream
            </button>
          </div>

          {/* Demo Scenario Selector (visible only in demo mode) */}
          {isDemoMode && (
            <select
              value={demoScenario}
              onChange={(e) => setDemoScenario(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minWidth: '160px', borderColor: 'rgba(251,192,0,0.4)' }}
            >
              {demoScenarios.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          )}

          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.875rem' }}
            title={isPaused ? 'Resume Chart' : 'Pause Chart'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Active Alerts Bar (if any) */}
      {activeAlerts.map((alert) => (
        <AlertBanner key={alert.alert_id} alert={alert} />
      ))}

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="demo-banner">
          <AlertTriangle size={16} />
          <span>
            <strong>DEMO SIMULATION ACTIVE:</strong> Generating synthetic waveforms for scenario "
            <strong>{demoScenarios.find(s => s.key === demoScenario)?.label || demoScenario}</strong>".
            This data is simulated and not from a physical battery.
          </span>
        </div>
      )}

      {/* Real-time KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* Voltage */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Pack Voltage</span>
            <Zap size={18} color="#66CC99" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {latestPacket?.voltage_v !== undefined && latestPacket?.voltage_v !== null
              ? `${latestPacket.voltage_v.toFixed(1)} V`
              : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>
            Rated: {selectedBattery?.rated_voltage_v || 400} V
          </div>
        </div>

        {/* Current */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Pack Current</span>
            <Activity size={18} color="#0088CC" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {latestPacket?.current_a !== undefined && latestPacket?.current_a !== null
              ? `${latestPacket.current_a.toFixed(1)} A`
              : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: latestPacket?.current_a && latestPacket.current_a < 0 ? '#FF633D' : '#4DBF88', marginTop: '0.25rem' }}>
            {latestPacket?.bms_status || 'IDLE'}
          </div>
        </div>

        {/* Power */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Instant Power</span>
            <Gauge size={18} color="#C89800" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {latestPacket?.power_w !== undefined && latestPacket?.power_w !== null
              ? `${(latestPacket.power_w / 1000).toFixed(2)} kW`
              : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>
            {latestPacket?.power_w ? `${latestPacket.power_w} W` : '0 W'}
          </div>
        </div>

        {/* Temperature */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Pack Temp</span>
            <Thermometer size={18} color={latestPacket?.temperature_c && latestPacket.temperature_c > 45 ? '#FF633D' : '#4DBF88'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {latestPacket?.temperature_c !== undefined && latestPacket?.temperature_c !== null
              ? `${latestPacket.temperature_c.toFixed(1)} °C`
              : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>
            Min {latestPacket?.min_cell_temp_c || '—'}° / Max {latestPacket?.max_cell_temp_c || '—'}°
          </div>
        </div>

        {/* State of Charge (SOC) */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">State of Charge</span>
            <BatteryIcon size={18} color="#66CC99" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3F4A56', marginTop: '0.5rem' }}>
            {latestPacket?.soc_pct !== undefined && latestPacket?.soc_pct !== null
              ? `${latestPacket.soc_pct.toFixed(0)}%`
              : '—'}
          </div>
          {/* SOC Bar */}
          <div style={{ width: '100%', height: '6px', backgroundColor: '#F7F9F8', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden', border: '1px solid #E2E8E5' }}>
            <div style={{ width: `${latestPacket?.soc_pct || 0}%`, height: '100%', backgroundColor: '#66CC99', borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Quality & Source */}
        <div className="card metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">Data Ingest</span>
            <ShieldCheck size={18} color="#66CC99" />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <DataSourceBadge source={latestPacket?.source || (isDemoMode ? 'demo' : 'esp32')} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.4rem' }}>
            Quality Score: <strong>{latestPacket?.data_quality_score ?? 100}%</strong>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.25rem' }}>
        {/* Voltage Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3F4A56' }}>Pack Voltage (V)</h3>
              <p style={{ fontSize: '0.75rem', color: '#8B949C' }}>High frequency real-time potential stream</p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#66CC99' }}>
              {latestPacket?.voltage_v?.toFixed(1) ?? '—'} V
            </span>
          </div>
          <LiveChart data={voltageSeries} dataKey="voltage" name="Voltage" unit="V" color="#66CC99" />
        </div>

        {/* Current Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3F4A56' }}>Current Flow (A)</h3>
              <p style={{ fontSize: '0.75rem', color: '#8B949C' }}>Discharge (-) and Charge (+) current</p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0088CC' }}>
              {latestPacket?.current_a?.toFixed(1) ?? '—'} A
            </span>
          </div>
          <LiveChart data={currentSeries} dataKey="current" name="Current" unit="A" color="#0088CC" />
        </div>

        {/* Temperature Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3F4A56' }}>Thermal Profile (°C)</h3>
              <p style={{ fontSize: '0.75rem', color: '#8B949C' }}>Pack thermocouple temperature</p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FF633D' }}>
              {latestPacket?.temperature_c?.toFixed(1) ?? '—'} °C
            </span>
          </div>
          <LiveChart data={tempSeries} dataKey="temperature" name="Temp" unit="°C" color="#FF633D" />
        </div>

        {/* State of Charge Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3F4A56' }}>SOC Trajectory (%)</h3>
              <p style={{ fontSize: '0.75rem', color: '#8B949C' }}>Coulomb counted State of Charge</p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#C89800' }}>
              {latestPacket?.soc_pct?.toFixed(0) ?? '—'}%
            </span>
          </div>
          <LiveChart data={socSeries} dataKey="soc" name="SOC" unit="%" color="#FBC000" yDomain={[0, 100]} />
        </div>
      </div>

      {/* Cell Voltage Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3F4A56' }}>Cell-Level Voltage Matrix</h3>
            <p style={{ fontSize: '0.8125rem', color: '#8B949C' }}>
              Individual series cell voltage balance & delta analysis
            </p>
          </div>
        </div>
        <CellVoltageGrid cellVoltages={latestPacket?.cell_voltages} />
      </div>
    </div>
  );
}
