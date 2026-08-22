// BatteryX AI – Login Page
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@batteryx.ai');
  const [password, setPassword] = useState('BatteryX2026!');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      login(data.access_token, { id: data.user_id, email: data.email, full_name: data.full_name, role: data.role });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FFFFFF', padding: '1.5rem',
      backgroundImage: 'radial-gradient(ellipse at 30% 30%, rgba(102,204,153,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(102,204,153,0.04) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #66CC99, #4DBF88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 20px rgba(102,204,153,0.28)',
          }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            BatteryX AI
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Sign in to your intelligence platform
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="demo-banner" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={14} />
          Demo: admin@batteryx.ai / BatteryX2026!
        </div>

        {/* Card */}
        <div className="card-lg">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'var(--color-danger-subtle)', border: '1px solid rgba(255,99,61,0.20)',
                borderRadius: 8, padding: '0.625rem 0.875rem', marginBottom: '1rem',
                fontSize: '0.875rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field" placeholder="••••••••"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
