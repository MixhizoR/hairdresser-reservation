import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import TrackPage from './pages/TrackPage';
import LoginPage from './pages/LoginPage';
import ContactPage from './pages/ContactPage';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import ServicesPage from './pages/admin/ServicesPage';
import StylistsPage from './pages/admin/StylistsPage';
import BarberPanel from './pages/barber/BarberPanel';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

/* ── Protected Route ── */
function ProtectedRoute({ children, allowedRoles, token, userRole, isRestoring }) {
  if (isRestoring)
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (userRole === 'BARBER') return <Navigate to="/berber" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('noir_token'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('noir_user_role'));
  const [currentUser, setCurrentUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(!!localStorage.getItem('noir_token'));

  /* ── Restore session ── */
  useEffect(() => {
    const saved = localStorage.getItem('noir_token');
    if (!saved) { setIsRestoring(false); return; }
    fetch(`${SERVER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${saved}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setToken(saved);
        setUserRole(data.role);
        setCurrentUser(data);
        localStorage.setItem('noir_user_role', data.role);
      })
      .catch(() => {
        localStorage.removeItem('noir_token');
        localStorage.removeItem('noir_user_role');
        setToken(null);
        setUserRole(null);
      })
      .finally(() => setIsRestoring(false));
  }, []);

  const handleLogin = async (username, password) => {
    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('noir_token', data.token);
      localStorage.setItem('noir_user_role', data.user.role);
      setToken(data.token);
      setUserRole(data.user.role);
      setCurrentUser(data.user);
      return { success: true, role: data.user.role };
    }
    return { success: false, error: data.error || 'Giriş başarısız.' };
  };

  const handleLogout = () => {
    localStorage.removeItem('noir_token');
    localStorage.removeItem('noir_user_role');
    setToken(null);
    setUserRole(null);
    setCurrentUser(null);
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  /* Shared props for admin/barber panels */
  const panelProps = { token, currentUser, userRole, authHeaders, onLogout: handleLogout };

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/track" element={<TrackPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/iletisim" element={<Navigate to="/contact" replace />} />
      <Route path="/login" element={
        token
          ? <Navigate to={userRole === 'ADMIN' ? '/admin' : '/berber'} replace />
          : <LoginPage onLogin={handleLogin} />
      } />

      {/* Admin — nested routes */}
      <Route path="/admin" element={
        <ProtectedRoute token={token} userRole={userRole} allowedRoles={['ADMIN']} isRestoring={isRestoring}>
          <AdminLayout {...panelProps} />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage {...panelProps} />} />
        <Route path="appointments" element={<AppointmentsPage {...panelProps} />} />
        <Route path="services" element={<ServicesPage {...panelProps} />} />
        <Route path="stylists" element={<StylistsPage {...panelProps} />} />
      </Route>

      {/* Barber */}
      <Route path="/berber" element={
        <ProtectedRoute token={token} userRole={userRole} allowedRoles={['BARBER']} isRestoring={isRestoring}>
          <BarberPanel {...panelProps} />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
