// BatteryX AI – Landing Page
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, BarChart3, Shield, Recycle, Award, ChevronRight, Battery, Activity, TrendingDown } from 'lucide-react';

const HOW_IT_WORKS = [
  { n: '01', title: 'Register Battery', desc: 'Add battery metadata — manufacturer, chemistry, rated capacity, cycle count and age.' },
  { n: '02', title: 'Enter Telemetry', desc: 'Upload measured parameters: voltage, current, temperature, SOC and internal resistance.' },
  { n: '03', title: 'Run AI Analysis', desc: 'The BatteryX AI engine processes your data through a multi-step diagnostic pipeline.' },
  { n: '04', title: 'Get Intelligence', desc: 'Receive SOH%, RUL estimate, safety risk level, and second-life classification.' },
  { n: '05', title: 'Generate Certificate', desc: 'Issue a digital battery health certificate with QR verification.' },
];

const INDUSTRIES = [
  'EV Manufacturers', 'EV Service Centers', 'Battery Recyclers', 'Second-Life Storage',
  'Fleet Operators', 'Insurance Companies', 'Battery Leasing', 'Grid Storage',
];

const FEATURES = [
  { icon: BarChart3, title: 'SOH Estimation', desc: 'Multi-factor State of Health estimation using capacity fade, internal resistance rise, cycle degradation, and calendar aging.', color: '#66CC99' },
  { icon: TrendingDown, title: 'Degradation Prediction', desc: 'Project battery capacity fade over 6, 12, 24 and 36 months with linear degradation models.', color: '#4DBF88' },
  { icon: Activity, title: 'RUL Prediction', desc: 'Estimate Remaining Useful Life in years and cycles based on chemistry-specific degradation rates.', color: '#66CC99' },
  { icon: Shield, title: 'Safety Risk Assessment', desc: 'Rule-based risk scoring across temperature, internal resistance, capacity degradation and cycle utilization.', color: '#FBC000' },
  { icon: Recycle, title: 'Second-Life Engine', desc: 'Classify batteries into: Continue EV Use, Second-Life Storage, Refurbishment, or Recycling.', color: '#66CC99' },
  { icon: Award, title: 'Digital Certification', desc: 'Generate professional battery health certificates with QR verification codes and PDF export.', color: '#4DBF88' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #66CC99, #4DBF88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(102,204,153,0.30)',
          }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>BatteryX AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/technology" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Technology</Link>
          <Link to="/about" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>About</Link>
          <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>Sign In</Link>
          <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '6rem 2rem 5rem', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(102,204,153,0.10) 0%, transparent 65%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background dot grid */}
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto' }}>
          <div className="badge badge-accent" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
            <Zap size={12} />AI-Powered Battery Intelligence
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem',
            letterSpacing: '-0.04em', color: 'var(--color-text-primary)',
          }}>
            Know Your Battery.<br />
            <span className="gradient-text">Predict Its Future.</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            AI-powered EV battery health assessment, degradation prediction and second-life certification for manufacturers, service centers and recyclers.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Analyze a Battery <ChevronRight size={18} />
            </Link>
            <Link to="/technology" className="btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
              Explore Technology
            </Link>
          </div>

          {/* Hero visual — battery metric cards */}
          <div style={{ marginTop: '4rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'State of Health', value: '87%', color: '#66CC99', sub: 'Good — Continue EV Use' },
              { label: 'RUL Estimate', value: '4.2y', color: '#4DBF88', sub: '1,680 cycles remaining' },
              { label: 'Safety Risk', value: 'LOW', color: '#66CC99', sub: 'Score: 18.5 / 100' },
              { label: 'Second-Life', value: '91/100', color: '#FBC000', sub: 'Stationary Storage' },
            ].map(m => (
              <div key={m.label} style={{
                background: '#FFFFFF', border: '1px solid var(--color-border)',
                borderRadius: 12, padding: '1rem 1.25rem', minWidth: 140, textAlign: 'center',
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <div style={{ fontSize: '1.625rem', fontWeight: 900, color: m.color, letterSpacing: '-0.03em' }}>{m.value}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 2 }}>{m.label}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-title" style={{ justifyContent: 'center', display: 'flex', marginBottom: 8 }}>How It Works</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>Battery Intelligence Workflow</h2>
        </div>
        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap', position: 'relative' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} style={{ flex: '1 1 180px', textAlign: 'center', padding: '1.25rem 1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #66CC99, #4DBF88)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem', fontSize: '0.875rem', fontWeight: 800, color: 'white',
                boxShadow: '0 4px 12px rgba(102,204,153,0.25)',
              }}>
                {step.n}
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>{step.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 2rem', background: 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="section-title" style={{ justifyContent: 'center', display: 'flex', marginBottom: 8 }}>Battery Intelligence</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>Six Layers of Battery Insight</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ borderLeft: `3px solid ${f.color}`, transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <f.icon size={20} color={f.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--color-text-primary)' }}>{f.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-title" style={{ justifyContent: 'center', display: 'flex', marginBottom: 8 }}>Industries</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>Built for the EV Battery Ecosystem</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {INDUSTRIES.map(ind => (
            <div key={ind} className="badge badge-accent" style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}>{ind}</div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '5rem 2rem', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(102,204,153,0.08) 0%, transparent 70%)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em', color: 'var(--color-text-primary)' }}>
          Turn Battery Data into<br /><span className="gradient-text">Lifecycle Intelligence</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
          Start with demo data. Connect your fleet. Scale across your battery ecosystem.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Start Free Demo
          </Link>
          <Link to="/login" className="btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem', background: 'var(--color-surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Zap size={14} color="var(--color-accent)" />
          <strong style={{ color: 'var(--color-text-secondary)' }}>BatteryX AI</strong>
          <span>— Prototype Platform</span>
        </div>
        <div>
          PROTOTYPE — For demonstration and research purposes only. Results are not scientifically validated. Not a certified safety assessment system.
        </div>
      </footer>
    </div>
  );
}
