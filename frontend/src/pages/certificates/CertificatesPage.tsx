// BatteryX AI – Certificates Listing Page
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, ExternalLink, RefreshCw, Filter, CheckCircle, XCircle } from 'lucide-react';
import { certificateApi } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Certificate } from '../../types';

export function CertificatesPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterRisk) params.risk = filterRisk;
      if (search) params.search = search;
      const list = await certificateApi.list(params);
      setCerts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterRisk]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3F4A56', letterSpacing: '-0.02em' }}>
            Digital Battery Passport Certificates
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#68737D', marginTop: '0.25rem' }}>
            Cryptographically verifiable health certificates, SOH guarantees, and second-life classifications.
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.875rem 1.25rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <input
            placeholder="Search by Certificate ID or Battery ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '150px' }}>
          <option value="">All Risk Levels</option>
          <option value="LOW">Low Risk</option>
          <option value="MODERATE">Moderate Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="CRITICAL">Critical Risk</option>
        </select>
      </div>

      {/* Certificates Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Battery Pack</th>
              <th>SOH Certified</th>
              <th>Est. RUL</th>
              <th>Risk Level</th>
              <th>Second-Life Suitability</th>
              <th>Issued Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading certificates...</td></tr>
            ) : certs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#8B949C' }}>
                  No certificates found. Run a diagnostic test on a battery to generate its digital passport.
                </td>
              </tr>
            ) : (
              certs.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#3F4A56', fontFamily: 'monospace' }}>
                      {c.certificate_id}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{c.battery_id_str || c.battery_id}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: c.soh_pct > 80 ? '#4DBF88' : '#FBC000' }}>
                      {c.soh_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>{c.rul_years} yrs</td>
                  <td>
                    <StatusBadge status={c.risk_level} type="risk" size="sm" />
                  </td>
                  <td style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                    {c.second_life_classification || 'Evaluation Pending'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#68737D' }}>
                    {new Date(c.issued_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => certificateApi.downloadPdf(c.certificate_id)}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        title="Download PDF Certificate"
                      >
                        <Download size={14} /> PDF
                      </button>
                      <Link
                        to={`/verify/${c.certificate_id}`}
                        target="_blank"
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#4DBF88' }}
                        title="Public Verification View"
                      >
                        <ExternalLink size={14} /> Verify
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
