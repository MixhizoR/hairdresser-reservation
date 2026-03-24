import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import TrackPage from './pages/TrackPage';
import AdminPage from './pages/AdminPage';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

/* ── Protected Route ── */
const ProtectedRoute = ({ children, token, userRole, allowedRoles, isRestoringSession }) => {
  if (isRestoringSession)
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Yükleniyor...</div>;

  if (token && !userRole)
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Yükleniyor...</div>;

  if (token && allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (userRole === 'BARBER') return <Navigate to="/berber" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  /* ── Auth state ── */
  const [token, setToken] = useState(localStorage.getItem('noir_token') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('noir_user_role') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(!!localStorage.getItem('noir_token'));

  /* ── Shared appointment state (used by AdminPage) ── */
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [soundType, setSoundType] = useState(localStorage.getItem('noir_sound_type') || 'synth');
  const [audioEnabled, setAudioEnabled] = useState(false);

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const location = useLocation();

  /* ── Restore session ── */
  useEffect(() => {
    const savedToken = localStorage.getItem('noir_token');
    if (!savedToken) { setIsRestoringSession(false); return; }

    fetch(`${SERVER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setToken(savedToken);
          setUserRole(data.user.role);
          setCurrentUser(data.user);
          localStorage.setItem('noir_user_role', data.user.role);
        } else {
          handleLogout();
        }
      })
      .catch(handleLogout)
      .finally(() => setIsRestoringSession(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Socket.io ── */
  useEffect(() => {
    if (!token) return;
    socketRef.current = io(SERVER_URL, { auth: { token } });

    socketRef.current.on('appointmentUpdate', (updated) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
    });

    socketRef.current.on('newAppointment', (apt) => {
      setAppointments((prev) => {
        if (prev.find((a) => a.id === apt.id)) return prev;
        return [apt, ...prev];
      });
      if (audioEnabled) playSynthBell();
    });

    return () => { socketRef.current?.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ── Fetch appointments when admin/barber is active ── */
  useEffect(() => {
    if (!token || !userRole) return;
    const role = userRole;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [apptRes, barberRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/appointments`, { headers }),
          fetch(`${SERVER_URL}/api/barbers`, { headers }),
        ]);
        const appts = await apptRes.json();
        const brbrs = await barberRes.json();
        if (Array.isArray(appts)) setAppointments(appts);
        if (Array.isArray(brbrs)) setBarbers(brbrs);
      } catch (e) {
        console.error('fetchData error', e);
      }
    };

    fetchData();
  }, [token, userRole]);

  /* ── Auth helpers ── */
  const handleLogin = async (username, password) => {
    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('noir_token', data.token);
      localStorage.setItem('noir_admin_user', data.username);
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
    localStorage.removeItem('noir_admin_user');
    localStorage.removeItem('noir_user_role');
    setToken(null);
    setUserRole(null);
    setCurrentUser(null);
    setAppointments([]);
  };

  /* ── Status update ── */
  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
      }
    } catch (e) {
      console.error('updateStatus error', e);
    }
  };

  /* ── Slot helpers ── */
  const generateSlots = () => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 17) slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  };

  const isSlotTaken = (barberId, slot) =>
    appointments.some(
      (a) =>
        a.barberId === barberId &&
        a.status !== 'cancelled' &&
        a.appointmentTime &&
        new Date(a.appointmentTime).toTimeString().startsWith(slot) &&
        new Date(a.appointmentTime).toISOString().split('T')[0] === selectedDate
    );

  const getSlotAppointment = (barberId, slot) =>
    appointments.find(
      (a) =>
        a.barberId === barberId &&
        a.status !== 'cancelled' &&
        a.appointmentTime &&
        new Date(a.appointmentTime).toTimeString().startsWith(slot) &&
        new Date(a.appointmentTime).toISOString().split('T')[0] === selectedDate
    );

  /* ── Audio ── */
  const toggleAudio = () => setAudioEnabled((v) => !v);

  const playSynthBell = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const playExternalFile = () => {};

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  /* ── Shared props for AdminPage ── */
  const adminProps = {
    appointments,
    updateStatus,
    audioEnabled,
    toggleAudio,
    soundType,
    setSoundType,
    playSynthBell,
    playExternalFile,
    generateSlots,
    isSlotTaken,
    getSlotAppointment,
    selectedDate,
    setSelectedDate,
    token,
    onLogin: handleLogin,
    onLogout: handleLogout,
    authHeaders,
    currentUser,
    userRole,
    barbers,
    t: {},
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/track" element={<TrackPage />} />

      {/* Staff — Barber */}
      <Route
        path="/berber"
        element={
          <ProtectedRoute token={token} userRole={userRole} allowedRoles={['BARBER']} isRestoringSession={isRestoringSession}>
            <AdminPage {...adminProps} isBarberPanel={true} />
          </ProtectedRoute>
        }
      />

      {/* Staff — Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute token={token} userRole={userRole} allowedRoles={['ADMIN']} isRestoringSession={isRestoringSession}>
            <AdminPage {...adminProps} isAdminPanel={true} />
          </ProtectedRoute>
        }
      />

      {/* Legacy /login → admin panel (AdminPage has its own login form) */}
      <Route path="/login" element={<Navigate to="/admin" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
