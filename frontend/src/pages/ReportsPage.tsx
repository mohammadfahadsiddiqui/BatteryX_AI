// BatteryX AI – Reports Page
import React from 'react';
import { FileText, Download, BarChart3, Shield, Recycle, Activity, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const REPORT_TYPES = [
  { icon: BarChart3, title: 'Battery Health Report', desc: 'SOH, health status, and trend analysis for a single battery.', badge: 'PDF', color: '#66CC99' },
  { icon: Activity, title: 'AI Diagnostic Report', desc: 'Full AI analysis output including all reasoning and feature explanations.', badge: 'PDF', color: '#4DBF88' },
  { icon: Activity, title: 'Degradation Report', desc: 'Capacity fade history and projected degradation curves.', badge: 'PDF', color: '#FBC000' },
  { icon: Shield, title: 'Safety Assessment', desc: 'Risk score, risk factors, and recommended actions.', badge: 'PDF', color: '#FF633D' },
  { icon: Recycle, title: 'Second-Life Assessment', desc: 'Second-life classification, score, and application recommendations.', badge: 'PDF', color: '#66CC99' },
  { icon: Award, title: 'Complete Lifecycle Report', desc: 'Full battery lifecycle report combining all assessments.', badge: 'PDF + CSV', color: '#4DBF88' },
];

export default function ReportsPage() {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4, color: 'var(--color-text-primary)' }}>Battery Reports</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Generate and export battery analysis reports in PDF or CSV format
        </p>
      </div>

      <div className="demo-banner" style={{ marginBottom: '1.25rem' }}>
        ⚠ Reports are generated from DEMO DATA. For actual battery analysis, run a diagnostic on a real battery first.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {REPORT_TYPES.map((r) => (
          <div key={r.title} className="metric-card" style={{ borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.icon size={20} color={r.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{r.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>{r.badge}</span>
                  <Link to="/batteries" className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}>
                    <Download size={13} />Select Battery
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>How to Generate a Report</div>
        <ol style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.8 }}>
          <li>Go to <Link to="/batteries" style={{ color: 'var(--color-accent)' }}>Battery Inventory</Link> and select a battery</li>
          <li>Run an AI Analysis on the battery details page</li>
          <li>Navigate to the Certificate tab to generate and download the PDF certificate</li>
          <li>Full report generation with all sections is available from the battery details page</li>
        </ol>
      </div>
    </div>
  );
}
