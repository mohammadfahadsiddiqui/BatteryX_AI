// BatteryX AI – Main App with routing
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
import ReportsPage from './pages/ReportsPage';
import VerifyPage from './pages/VerifyPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/technology" element={<TechnologyPage />} />
      <Route path="/about" element={<TechnologyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />

      {/* Protected app pages */}
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
