// BatteryX AI – Main App with Extended Routing (v3.0)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Existing Pages
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

// New v3.0 Pages
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

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/technology" element={<TechnologyPage />} />
      <Route path="/about" element={<TechnologyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />

      {/* Protected App Pages */}
      <Route path="/dashboard" element={
        <PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/batteries" element={
        <PrivateRoute><AppLayout><BatteryInventoryPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/batteries/add" element={
        <PrivateRoute><AppLayout><AddBatteryPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/batteries/:id" element={
        <PrivateRoute><AppLayout><BatteryDetailsPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/compare" element={
        <PrivateRoute><AppLayout><BatteryComparisonPage /></AppLayout></PrivateRoute>
      } />

      {/* Live & Hardware */}
      <Route path="/live-monitor" element={
        <PrivateRoute><AppLayout><LiveMonitorPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/hardware" element={
        <PrivateRoute><AppLayout><HardwareCenterPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/hardware/:id" element={
        <PrivateRoute><AppLayout><HardwareDeviceDetailPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/bms" element={
        <PrivateRoute><AppLayout><BMSManagerPage /></AppLayout></PrivateRoute>
      } />

      {/* Diagnostics & AI */}
      <Route path="/diagnostics" element={
        <PrivateRoute><AppLayout><DiagnosticsPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/diagnostics/new" element={
        <PrivateRoute><AppLayout><NewDiagnosticPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/ai-intelligence" element={
        <PrivateRoute><AppLayout><AIIntelligencePage /></AppLayout></PrivateRoute>
      } />
      <Route path="/lifecycle" element={
        <PrivateRoute><AppLayout><LifecyclePage /></AppLayout></PrivateRoute>
      } />
      <Route path="/maintenance" element={
        <PrivateRoute><AppLayout><MaintenancePage /></AppLayout></PrivateRoute>
      } />

      {/* Operations & Records */}
      <Route path="/fleet" element={
        <PrivateRoute><AppLayout><FleetPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/alerts" element={
        <PrivateRoute><AppLayout><AlertsPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/certificates" element={
        <PrivateRoute><AppLayout><CertificatesPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute><AppLayout><ReportsPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute><AppLayout><SettingsPage /></AppLayout></PrivateRoute>
      } />

      {/* Admin */}
      <Route path="/admin/users" element={
        <PrivateRoute><AppLayout><AdminUsersPage /></AppLayout></PrivateRoute>
      } />
      <Route path="/admin/audit-logs" element={
        <PrivateRoute><AppLayout><AuditLogsPage /></AppLayout></PrivateRoute>
      } />

      {/* Catch-all */}
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
