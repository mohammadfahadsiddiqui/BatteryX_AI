// BatteryX AI – App Layout with Extended Sidebar (v3.0)
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Battery, Plus, FileText, Settings,
  Users, ScrollText, LogOut, Menu, X, Zap,
  Activity, Cpu, Shield, AlertTriangle, Truck, Award,
  Sparkles, Wrench, Columns, History, CheckCircle
} from 'lucide-react';
import { alertApi } from '../../services/api';

const NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    group: 'Live & Hardware Telemetry',
    items: [
      { label: 'Live Monitor', icon: Activity, path: '/live-monitor', badge: 'LIVE' },
      { label: 'Hardware Edge Nodes', icon: Cpu, path: '/hardware' },
      { label: 'BMS & CAN Manager', icon: Shield, path: '/bms' },
    ],
  },
  {
    group: 'Battery Fleet & Assets',
    items: [
      { label: 'Battery Inventory', icon: Battery, path: '/batteries' },
      { label: 'Add Battery', icon: Plus, path: '/batteries/add' },
      { label: 'Multi-Pack Benchmark', icon: Columns, path: '/compare' },
      { label: 'EV Fleet Operations', icon: Truck, path: '/fleet' },
    ],
  },
  {
    group: 'Diagnostics & AI Intelligence',
    items: [
      { label: 'Diagnostic Sessions', icon: CheckCircle, path: '/diagnostics' },
      { label: 'AI Degradation Hub', icon: Sparkles, path: '/ai-intelligence' },
      { label: 'Lifecycle & Provenance', icon: History, path: '/lifecycle' },
      { label: 'Service & Maintenance', icon: Wrench, path: '/maintenance' },
    ],
  },
  {
    group: 'Operations & Alerts',
    items: [
      { label: 'Alerts & Faults', icon: AlertTriangle, path: '/alerts', hasAlertBadge: true },
      { label: 'Digital Passports', icon: Award, path: '/certificates' },
      { label: 'Reports', icon: FileText, path: '/reports' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'User Management', icon: Users, path: '/admin/users' },
      { label: 'Audit Trail Logs', icon: ScrollText, path: '/admin/audit-logs' },
      { label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);

  // Poll alert count for sidebar badge
  useEffect(() => {
    alertApi.count().then((res) => setActiveAlertCount(res.total)).catch(() => {});
    const interval = setInterval(() => {
      alertApi.count().then((res) => setActiveAlertCount(res.total)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #66CC99, #4DBF88)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(102, 204, 153, 0.30)',
              }}
            >
              <Zap size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                BatteryX AI
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>v3.0 Ecosystem</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((group) => (
          <div key={group.group} style={{ marginBottom: '0.75rem' }}>
            <div
              style={{
                padding: '0.4rem 1rem 0.2rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              {group.group}
            </div>
            {group.items.map((item: any) => {
              let active = location.pathname === item.path;
              if (!active && item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/')) {
                // If we are on a subpath, only highlight the parent if there isn't a more specific exact match in the sidebar
                const isExactMatchForAnother = NAV_ITEMS.some(g => 
                  g.items.some(i => i.path === location.pathname && i.path !== item.path)
                );
                if (!isExactMatchForAnother) {
                  active = true;
                }
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(102,204,153,0.18)',
                        color: '#2E9F68',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.hasAlertBadge && activeAlertCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: 'rgba(255,99,61,0.18)',
                        color: '#FF633D',
                      }}
                    >
                      {activeAlertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', borderRadius: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #66CC99, #4DBF88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}
          >
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.full_name || user?.email}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Desktop Sidebar */}
      <div className="sidebar" style={{ display: 'block' }}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(63,74,86,0.45)', zIndex: 49 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {sidebarOpen && (
        <div className="sidebar" style={{ transform: 'translateX(0)', zIndex: 60 }}>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={20} />
          </button>
          <SidebarContent />
        </div>
      )}

      {/* Main Content */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar for mobile */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
          className="mobile-topbar"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>BatteryX AI</span>
        </div>
        <main style={{ flex: 1, padding: '1.5rem 2rem', overflowX: 'hidden', background: '#FFFFFF' }} className="page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
