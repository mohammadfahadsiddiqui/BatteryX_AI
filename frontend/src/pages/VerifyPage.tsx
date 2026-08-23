// BatteryX AI – Certificate Verification Page (public)
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Zap, Shield, Clock } from 'lucide-react';
import { certificateApi } from '../services/api';
import type { VerifyResponse } from '../types';
import { getSOHColor } from '../utils/helpers';

export default function VerifyPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!certificateId) return;
    certificateApi.verify(certificateId)
      .then(setData)
      .catch(() => setError('Certificate not found or invalid'))
      .finally(() => setLoading(false));
  }, [certificateId]);

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(102,204,153,0.07) 0%, transparent 55%)',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <Zap size={22} color="var(--color-accent)" />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>BatteryX AI</span>
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Certificate Verification Portal</div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
            <div style={{ color: 'var(--color-text-muted)' }}>Verifying certificate...</div>
          </div>
        )}

        {error && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <XCircle size={56} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
            <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 8 }}>Certificate Not Found</div>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Certificate ID "{certificateId}" could not be verified. It may be invalid or expired.
            </div>
            <Link to="/" className="btn-secondary">Return to Home</Link>
          </div>
        )}

        {data && (
          <div>
            <div className="demo-banner" style={{ marginBottom: '1rem' }}>
              ⚠ DEMO — This certificate was generated from simulated data. Not a real-world validated assessment.
            </div>

            <div className="card-lg" style={{ borderColor: data.is_valid ? 'rgba(102,204,153,0.35)' : 'rgba(255,99,61,0.30)' }}>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                {data.is_valid
                  ? <CheckCircle size={36} color="#66CC99" />
                  : <XCircle size={36} color="#FF633D" />}
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: data.is_valid ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {data.is_valid ? 'Certificate Valid' : 'Certificate Invalid'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Verified at {new Date(data.verified_at || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'State of Health', value: `${data.soh_pct}%`, color: getSOHColor(data.soh_pct) },
                  { label: 'Est. RUL', value: `${data.rul_years}y`, color: 'var(--color-accent)' },
                  { label: 'Safety Risk', value: data.risk_level, color: data.risk_level === 'LOW' ? '#66CC99' : data.risk_level === 'MODERATE' ? '#FBC000' : '#FF633D' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: 900, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Details */}
              {[
                ['Certificate ID', data.certificate_id],
                ['Battery ID', data.battery_id],
                ['Second-Life Classification', data.second_life_classification],
                ['Issue Date', new Date(data.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                ['Issued By', data.issuer],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <Link to="/" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                  Powered by BatteryX AI Platform
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
