// BatteryX AI – New Diagnostic Wizard Page
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, Cpu, FileText, Activity } from 'lucide-react';
import { diagnosticApi, batteryApi, hardwareApi } from '../../services/api';
import type { Battery, HardwareDevice } from '../../types';

export function NewDiagnosticPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedBattery = searchParams.get('battery') || '';

  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [devices, setDevices] = useState<HardwareDevice[]>([]);

  // Wizard state
  const [step, setStep] = useState<number>(1);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(preSelectedBattery);
  const [dataSource, setDataSource] = useState<string>('manual');
  const [diagType, setDiagType] = useState<string>('Comprehensive Health Diagnostic');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Manual measurement fields
  const [voltage, setVoltage] = useState<string>('400.0');
  const [current, setCurrent] = useState<string>('0.0');
  const [temperature, setTemperature] = useState<string>('25.0');
  const [soc, setSoc] = useState<string>('80.0');
  const [resistance, setResistance] = useState<string>('8.5');

  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    batteryApi.list().then((batts) => {
      setBatteries(batts);
      if (!selectedBatteryId && batts.length > 0) {
        setSelectedBatteryId(batts[0].battery_id);
      }
    });
    hardwareApi.list().then(setDevices);
  }, []);

  const handleRunDiagnostic = async () => {
    if (!selectedBatteryId) {
      alert('Please select a battery');
      return;
    }

    setRunning(true);
    try {
      // 1. Create session
      const session = await diagnosticApi.create({
        battery_id: selectedBatteryId,
        diagnostic_type: diagType,
        data_source: dataSource,
        device_id: selectedDeviceId || undefined,
      });

      // 2. Start session
      await diagnosticApi.start(session.session_id);

      // 3. Complete and run AI engine
      await diagnosticApi.complete(session.session_id, {
        voltage_v: parseFloat(voltage) || 400.0,
        current_a: parseFloat(current) || 0.0,
        temperature_c: parseFloat(temperature) || 25.0,
        soc_pct: parseFloat(soc) || 80.0,
        internal_resistance_mohm: parseFloat(resistance) || 8.5,
      });

      // 4. Redirect to battery details or diagnostics
      navigate(`/batteries/${selectedBatteryId}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to complete diagnostic run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => navigate('/diagnostics')} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56' }}>Run Diagnostic Test</h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D' }}>
            Configure and trigger physics-based battery health and degradation analysis.
          </p>
        </div>
      </div>

      {/* Step Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {[
          { num: 1, label: '1. Target Battery' },
          { num: 2, label: '2. Ingestion Source' },
          { num: 3, label: '3. Parameters & Execute' },
        ].map((s) => (
          <div
            key={s.num}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.8125rem',
              background: step === s.num ? 'rgba(102,204,153,0.15)' : '#F7F9F8',
              color: step === s.num ? '#4DBF88' : '#8B949C',
              border: `1px solid ${step === s.num ? '#66CC99' : '#E2E8E5'}`,
            }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1: Select Battery & Test Type */}
      {step === 1 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#3F4A56' }}>Step 1: Select Target Battery</h2>

          <div>
            <label className="label">Target Battery Pack</label>
            <select
              value={selectedBatteryId}
              onChange={(e) => setSelectedBatteryId(e.target.value)}
              className="input-field"
            >
              {batteries.map((b) => (
                <option key={b.id} value={b.battery_id}>
                  {b.battery_id} — {b.manufacturer} {b.model} ({b.chemistry || 'NMC'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Diagnostic Test Profile</label>
            <select value={diagType} onChange={(e) => setDiagType(e.target.value)} className="input-field">
              <option value="Comprehensive Health Diagnostic">Comprehensive Health & SOH Diagnostic</option>
              <option value="Rapid Screening Diagnostic">Rapid Screening Assessment</option>
              <option value="Second-Life Recertification Test">Second-Life Recertification Test</option>
              <option value="Thermal Stress Characterization">Thermal Stress Characterization</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={() => setStep(2)} className="btn-primary">
              Next: Ingestion Source →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Data Ingestion Source */}
      {step === 2 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#3F4A56' }}>Step 2: Choose Data Source</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { key: 'manual', title: 'Manual Entry', desc: 'Direct lab measurement input' },
              { key: 'esp32',  title: 'ESP32 Edge Node', desc: 'Hardware sensor reading stream' },
              { key: 'bms',    title: 'BMS CAN Bridge', desc: 'Real-time BMS controller frames' },
              { key: 'demo',   title: 'Demo Simulation', desc: 'Simulated diagnostic waveform' },
            ].map((src) => (
              <div
                key={src.key}
                onClick={() => setDataSource(src.key)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `2px solid ${dataSource === src.key ? '#66CC99' : '#E2E8E5'}`,
                  background: dataSource === src.key ? 'rgba(102,204,153,0.06)' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 700, color: '#3F4A56', fontSize: '0.95rem' }}>{src.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#8B949C', marginTop: '0.25rem' }}>{src.desc}</div>
              </div>
            ))}
          </div>

          {dataSource === 'esp32' && (
            <div>
              <label className="label">Select Provisioned ESP32 Node</label>
              <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="input-field">
                <option value="">-- Auto-detect / Any available node --</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.device_id}>{d.name} ({d.device_id})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <button onClick={() => setStep(1)} className="btn-secondary">
              ← Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Next: Parameters →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Parameters & Run */}
      {step === 3 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#3F4A56' }}>Step 3: Test Measurements & Run</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Pack Voltage (V)</label>
              <input value={voltage} onChange={(e) => setVoltage(e.target.value)} type="number" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="label">Load Current (A)</label>
              <input value={current} onChange={(e) => setCurrent(e.target.value)} type="number" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="label">Pack Temperature (°C)</label>
              <input value={temperature} onChange={(e) => setTemperature(e.target.value)} type="number" step="0.5" className="input-field" />
            </div>
            <div>
              <label className="label">Internal Resistance (mΩ)</label>
              <input value={resistance} onChange={(e) => setResistance(e.target.value)} type="number" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="label">State of Charge (%)</label>
              <input value={soc} onChange={(e) => setSoc(e.target.value)} type="number" step="1" className="input-field" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button onClick={() => setStep(2)} className="btn-secondary">
              ← Back
            </button>
            <button
              onClick={handleRunDiagnostic}
              disabled={running}
              className="btn-primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
            >
              {running ? (
                <>
                  <div className="spinner" />
                  Running AI Analysis...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Execute Diagnostic & Generate SOH
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
