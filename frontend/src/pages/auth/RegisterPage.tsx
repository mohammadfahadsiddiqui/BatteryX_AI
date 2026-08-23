// BatteryX AI – Register Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', organization_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.register(form.email, form.password, form.full_name, form.organization_name || undefined);
      login(data.access_token, { id: data.user_id, email: data.email, full_name: data.full_name, role: data.role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const field = (key: keyof typeof form, label: string, type: string, placeholder: string, Icon: any, required = true) => (
    <div style={{ marginBottom: '1rem' }}>
      <label className="label">{label}{!required && ' (optional)'}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} required={required} value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="input-field" placeholder={placeholder}
          style={{ paddingLeft: '2.5rem' }}
        />
        <Icon size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FFFFFF', padding: '1.5rem',
      backgroundImage: 'radial-gradient(ellipse at 30% 30%, rgba(102,204,153,0.07) 0%, transparent 55%)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #66CC99, #4DBF88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(102,204,153,0.28)',
          }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4, color: 'var(--color-text-primary)' }}>Create Account</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Join the BatteryX AI platform</p>
        </div>

        <div className="card-lg">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'var(--color-danger-subtle)', border: '1px solid rgba(255,99,61,0.20)', borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={15} />{error}
              </div>
            )}
            {field('full_name', 'Full Name', 'text', 'John Smith', User)}
            {field('email', 'Email Address', 'email', 'you@example.com', Mail)}
            {field('password', 'Password', 'password', '••••••••', Lock)}
            {field('organization_name', 'Organization', 'text', 'Your company name', User, false)}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} />Creating account...</> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
