// BatteryX AI – Main App with Extended Routing (v3.0)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import TechnologyPage from './pages/TechnologyPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BatteryInventoryPage from './pages/batteries/BatteryInventoryPage';
import AddBatteryPage from './pages/batteries/AddBatteryPage';
import BatteryDetailsPage from './pages/batteries/BatteryDetailsPage';
import { BatteryComparisonPage } from './pages/batteries/BatteryComparisonPage';
import ReportsPage from './pages/ReportsPage';
import VerifyPage from './pages/VerifyPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { HardwareCenterPage } from './pages/hardware/HardwareCenterPage';
import { HardwareDeviceDetailPage } from './pages/hardware/HardwareDeviceDetailPage';
import { DiagnosticsPage } from './pages/diagnostics/DiagnosticsPage';
import { NewDiagnosticPage } from './pages/diagnostics/NewDiagnosticPage';
import { BMSManagerPage } from './pages/bms/BMSManagerPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { LifecyclePage } from './pages/lifecycle/LifecyclePage';
import { FleetPage } from './pages/fleet/FleetPage';
import { CertificatesPage } from './pages/certificates/CertificatesPage';
import { AIIntelligencePage } from './pages/ai/AIIntelligencePage';
import { MaintenancePage } from './pages/maintenance/MaintenancePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function Protected({ children }: { children: React.ReactNode }) {
  return <PrivateRoute><AppLayout>{children}</AppLayout></PrivateRoute>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/technology" element={<TechnologyPage />} />
      <Route path="/about" element={<TechnologyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />

      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/batteries" element={<Protected><BatteryInventoryPage /></Protected>} />
      <Route path="/batteries/add" element={<Protected><AddBatteryPage /></Protected>} />
      <Route path="/batteries/:id" element={<Protected><BatteryDetailsPage /></Protected>} />
      <Route path="/compare" element={<Protected><BatteryComparisonPage /></Protected>} />

      <Route path="/live-monitor" element={<Protected><LiveMonitorPage /></Protected>} />
      <Route path="/hardware" element={<Protected><HardwareCenterPage /></Protected>} />
      <Route path="/hardware/:id" element={<Protected><HardwareDeviceDetailPage /></Protected>} />
      <Route path="/bms" element={<Protected><BMSManagerPage /></Protected>} />

      <Route path="/diagnostics" element={<Protected><DiagnosticsPage /></Protected>} />
      <Route path="/diagnostics/new" element={<Protected><NewDiagnosticPage /></Protected>} />
      <Route path="/ai-intelligence" element={<Protected><AIIntelligencePage /></Protected>} />
      <Route path="/lifecycle" element={<Protected><LifecyclePage /></Protected>} />
      <Route path="/maintenance" element={<Protected><MaintenancePage /></Protected>} />

      <Route path="/fleet" element={<Protected><FleetPage /></Protected>} />
      <Route path="/alerts" element={<Protected><AlertsPage /></Protected>} />
      <Route path="/certificates" element={<Protected><CertificatesPage /></Protected>} />
      <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

      <Route path="/admin/users" element={<Protected><AdminUsersPage /></Protected>} />
      <Route path="/admin/audit-logs" element={<Protected><AuditLogsPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
