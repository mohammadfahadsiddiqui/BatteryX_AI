// BatteryX AI – Technology Page
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, BarChart3, Activity, Shield, Recycle, Award, ArrowLeft } from 'lucide-react';

export default function TechnologyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', padding: '2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={15} />Back
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
            Battery Intelligence <span className="gradient-text">Technology</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.0625rem', maxWidth: 600, margin: '0 auto' }}>
            BatteryX AI uses a multi-factor physics-based analysis engine to evaluate EV battery health, predict degradation, and assess second-life potential.
          </p>
        </div>

        <div className="demo-banner" style={{ marginBottom: '2rem' }}>
          ⚠ PROTOTYPE — The BatteryX AI analysis engine is a prototype using deterministic physics-based formulas. It is NOT a validated scientific instrument or certified safety system. Results are estimates for research and demonstration only.
        </div>

        {[
          {
            icon: BarChart3, color: '#66CC99', title: 'State of Health (SOH) Estimation',
            desc: 'SOH is estimated using a weighted multi-component model:',
            bullets: [
              'Capacity Component (35-45%): Derived from measured capacity vs rated capacity, or estimated from cycle count degradation curve',
              'Internal Resistance Component (30%): Rising resistance mapped to health using chemistry-specific baseline values',
              'Cycle Degradation Component (15%): Fraction of chemistry-rated cycle lifetime consumed',
              'Calendar Aging Component (10%): Annual fade rate × battery age in years',
              'Temperature Stress Penalty: Applied when operating temperature exceeds optimal range',
            ],
          },
          {
            icon: Activity, color: '#4DBF88', title: 'Remaining Useful Life (RUL) Prediction',
            desc: 'RUL is estimated by linear extrapolation from current SOH to end-of-life threshold (70%):',
            bullets: [
              'Chemistry-specific annual degradation rates (LFP: 1.8%/yr, NMC: 2.5%/yr, NCA: 3.2%/yr)',
              'Temperature-adjusted degradation rate (elevated temperature increases degradation)',
              'Years until SOH reaches 70% EOL threshold',
              'Cycle-based RUL: Remaining cycles before rated cycle lifetime is consumed',
              'Projections at 6, 12, 24, and 36 months',
            ],
          },
          {
            icon: Shield, color: '#FBC000', title: 'Safety Risk Assessment',
            desc: 'Rule-based risk scoring across four primary risk domains:',
            bullets: [
              'Temperature Risk: Penalties for operation above 35°C (moderate), 40°C (high), 50°C (critical)',
              'Internal Resistance Risk: Risk score based on ratio to chemistry baseline (>1.8×, >2.5×, >4×)',
              'Capacity Degradation Risk: Penalties for SOH <80%, <70%, <60%',
              'Cycle Utilization Risk: Elevated risk when cycle count exceeds 70%, 90% of rated lifetime',
            ],
          },
          {
            icon: Recycle, color: '#66CC99', title: 'Second-Life Suitability Engine',
            desc: 'Battery lifecycle classification based on SOH, risk level, cycle count, and chemistry:',
            bullets: [
              'Continue EV Use: SOH ≥85%, low risk, cycle utilization <60%',
              'Second-Life Energy Storage: SOH 65-85%, moderate risk acceptable',
              'Refurbishment: SOH 45-65%, requires physical inspection and reconditioning',
              'Recycling: SOH <45% or HIGH risk with limited remaining cycle life',
              'LFP chemistry bonus: Higher inherent cycle life improves second-life classification',
            ],
          },
        ].map(s => (
          <div key={s.title} className="card" style={{ marginBottom: '1.25rem', borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} color={s.color} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--color-text-primary)' }}>{s.title}</h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{s.desc}</p>
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: 1.8 }}>
              {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/register" className="btn-primary" style={{ padding: '0.875rem 2rem' }}>Try the Platform</Link>
        </div>
      </div>
    </div>
  );
}
