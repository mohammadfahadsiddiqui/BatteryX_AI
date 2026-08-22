// BatteryX AI – Add Battery Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { batteryApi } from '../../services/api';


const CHEMISTRY_OPTIONS = ['Li-ion NMC', 'LFP', 'Li-ion NCA', 'NMC 811', 'NMC 622'];

export default function AddBatteryPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    battery_id: '', manufacturer: '', model: '', chemistry: 'Li-ion NMC',
    rated_capacity_ah: '', rated_voltage_v: '', age_years: '', cycle_count: '',
    manufacturing_date: '', installation_date: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.battery_id.trim()) { setError('Battery ID is required'); return; }
    setError(''); setLoading(true);
    try {
      const payload: any = {
        battery_id: form.battery_id.trim(),
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        chemistry: form.chemistry || undefined,
        rated_capacity_ah: form.rated_capacity_ah ? parseFloat(form.rated_capacity_ah) : undefined,
        rated_voltage_v: form.rated_voltage_v ? parseFloat(form.rated_voltage_v) : undefined,
        age_years: form.age_years ? parseFloat(form.age_years) : undefined,
        cycle_count: form.cycle_count ? parseInt(form.cycle_count) : 0,
        manufacturing_date: form.manufacturing_date || undefined,
        installation_date: form.installation_date || undefined,
        notes: form.notes || undefined,
      };
      const result = await batteryApi.create(payload);
      setSuccess(`Battery ${form.battery_id} added successfully!`);
      setTimeout(() => navigate(`/batteries/${form.battery_id}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add battery');
    } finally { setLoading(false); }
  };

  const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '1rem' }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/batteries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={15} />Back to Inventory
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Add New Battery</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Enter battery metadata to register it in the BatteryX AI platform</p>
      </div>

      {success && (
        <div style={{ background: 'var(--color-success-subtle)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--color-success)' }}>
          <CheckCircle size={18} />{success}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-danger-subtle)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--color-danger)' }}>
          <AlertCircle size={18} />{error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Identification */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Battery Identification
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FieldGroup label="Battery ID *">
              <input className="input-field" placeholder="e.g. BX-2026-00200" value={form.battery_id} onChange={set('battery_id')} required />
            </FieldGroup>
            <FieldGroup label="Manufacturer">
              <input className="input-field" placeholder="e.g. CATL, BYD, Panasonic" value={form.manufacturer} onChange={set('manufacturer')} />
            </FieldGroup>
            <FieldGroup label="Model">
              <input className="input-field" placeholder="Battery model name" value={form.model} onChange={set('model')} />
            </FieldGroup>
            <FieldGroup label="Battery Chemistry">
              <select className="input-field" value={form.chemistry} onChange={set('chemistry')}>
                {CHEMISTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldGroup>
          </div>
        </div>

        {/* Specifications */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Electrical Specifications
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FieldGroup label="Rated Capacity (Ah)">
              <input className="input-field" type="number" step="0.1" placeholder="e.g. 100" value={form.rated_capacity_ah} onChange={set('rated_capacity_ah')} />
            </FieldGroup>
            <FieldGroup label="Rated Voltage (V)">
              <input className="input-field" type="number" step="0.1" placeholder="e.g. 400" value={form.rated_voltage_v} onChange={set('rated_voltage_v')} />
            </FieldGroup>
          </div>
        </div>

        {/* Usage History */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Usage History
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FieldGroup label="Cycle Count">
              <input className="input-field" type="number" placeholder="e.g. 500" value={form.cycle_count} onChange={set('cycle_count')} />
            </FieldGroup>
            <FieldGroup label="Battery Age (years)">
              <input className="input-field" type="number" step="0.1" placeholder="e.g. 2.5" value={form.age_years} onChange={set('age_years')} />
            </FieldGroup>
            <FieldGroup label="Manufacturing Date">
              <input className="input-field" type="date" value={form.manufacturing_date} onChange={set('manufacturing_date')} />
            </FieldGroup>
            <FieldGroup label="Installation Date">
              <input className="input-field" type="date" value={form.installation_date} onChange={set('installation_date')} />
            </FieldGroup>
          </div>
          <FieldGroup label="Notes">
            <textarea className="input-field" rows={3} placeholder="Additional notes about this battery..." value={form.notes} onChange={set('notes') as any} style={{ resize: 'vertical' }} />
          </FieldGroup>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Link to="/batteries" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} />Adding...</> : <><Plus size={16} />Add Battery</>}
          </button>
        </div>
      </form>
    </div>
  );
}
