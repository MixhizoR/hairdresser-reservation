import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Scissors, Calendar, Shield, User } from 'lucide-react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

// In development, this uses the Vite proxy ('' means relative path).
// In production, this can also be '' if the backend serves the frontend, or a specific URL.
const SERVER_URL = import.meta.env.VITE_API_URL || '';

const ProtectedRoute = ({ children, token, userRole, allowedRoles, isRestoringSession }) => {
  if (isRestoringSession) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Yükleniyor...</div>;

  // If we have a token, check if the role is allowed
  // Wait until userRole is available if we have a token
  if (token && !userRole) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--primary)' }}>Yükleniyor...</div>;

  if (token && allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (userRole === 'BARBER') return <Navigate to="/berber" replace />;
    return <Navigate to="/" replace />;
  }

  // If no token, we allow children (AdminPage will show login form)
  // If token and role is correct, we allow children
  return children;
};

function App() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [newAppointment, setNewAppointment] = useState({ name: '', phone: '', service: 'Saç Kesimi', time: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [soundType, setSoundType] = useState(localStorage.getItem('noir_sound_type') || 'synth');
  const [token, setToken] = useState(localStorage.getItem('noir_token') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('noir_user_role') || null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(!!token);
  const location = useLocation();

  const socketRef = useRef(null);

  const t = {
    brand: 'HairMan Studio',
    bookStylist: 'Randevu Al',
    secureSlot: 'Randevu Oluştur',
    experienceArt: 'Şehrin kalbinde bakım sanatını deneyimleyin.',
    clientName: 'Müşteri Adı',
    clientNamePlaceholder: 'Örn: Alexander Noir',
    contactPhone: 'İletişim Telefonu',
    selectArt: 'Hizmetlerimiz',
    selectBarber: 'Berber Seçin',
    preferredSchedule: 'Tarih Seçin',
    selectTimeSlot: 'Saat Dilimi Seçin',
    requestAppointment: 'RANDEVU TALEBİ GÖNDER',
    reservationSent: 'RANDEVU GÖNDERİLDİ',
    conciergeDashboard: 'Yönetici Paneli',
    barberDashboard: 'Berber Paneli',
    adminDashboard: 'Admin Panel',
    managingClientele: 'Premium müşteri yönetimi',
    systemAudible: 'SES AKTİF',
    activateVoice: 'SESİ ETKİNLEŞTİR',
    liveOpsActive: 'CANLI TAKİP AKTİF',
    timeNotSet: 'Zaman ayarlanmadı',
    services: [
      'Saç Kesimi', 'Sakal Kesimi', 'Saç & Sakal Kesimi', 'Çocuk Tıraşı',
      'Cilt Bakımı', 'Kaş Alımı', 'Fön', 'Ağda', 'Damat Tıraşı', 'Ev Tıraşı'
    ],
    approved: 'ONAYLANDI',
    pending: 'BEKLEMEDE',
    rejected: 'REDDEDİLDİ',
    completed: 'TAMAMLANDI',
    approve: 'Onayla',
    reject: 'Reddet',
    complete: 'Tamamla',
    notificationSound: 'Bildirim Sesi',
    saveSettings: 'KAYDET',
    slotOverview: 'Günlük Saat Durumu',
    available: 'Müsait',
    booked: 'Dolu',
  };

  // ─── Auth Header Helper ───
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  });

  // ─── Audio ───
  const audioEnabledRef = useRef(audioEnabled);
  const audioCtxRef = useRef(null);
  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  };

  const playSynthBell = () => {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const strike = ctx.createOscillator();
    const hum = ctx.createOscillator();
    const gain = ctx.createGain();
    strike.type = 'triangle';
    strike.frequency.setValueAtTime(880, now);
    strike.frequency.exponentialRampToValueAtTime(440, now + 1.5);
    hum.type = 'sine';
    hum.frequency.setValueAtTime(1760, now);
    hum.frequency.exponentialRampToValueAtTime(880, now + 2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    strike.connect(gain); hum.connect(gain); gain.connect(ctx.destination);
    strike.start(now); hum.start(now);
    strike.stop(now + 2); hum.stop(now + 2);
  };

  const playExternalFile = (filename) => {
    const audio = new Audio(`/sounds/${filename}`);
    audio.play().catch(() => playSynthBell());
  };

  const playNotificationSound = () => {
    try {
      const type = localStorage.getItem('noir_sound_type') || 'synth';
      type !== 'synth' ? playExternalFile(type) : playSynthBell();
    } catch (e) { console.error('Audio error:', e); }
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (next) playNotificationSound();
  };

  // ─── Fetch Barbers ───
  useEffect(() => {
    fetch(`${SERVER_URL}/api/barbers`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setBarbers(data);
        if (data.length > 0 && !selectedBarber) {
          setSelectedBarber(data[0].id);
        }
      })
      .catch(err => {
        console.error('[DEBUG] Barbers fetch error:', err);
      });
  }, []);

  // ─── Restore Session ───
  useEffect(() => {
    if (token && !currentUser) {
      fetch(`${SERVER_URL}/api/auth/me`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(user => {
          setCurrentUser(user);
          setUserRole(user.role);
          setIsRestoringSession(false);
        })
        .catch(() => {
          handleLogout();
          setIsRestoringSession(false);
        });
    } else {
      setIsRestoringSession(false);
    }
  }, [token]);

  // ─── Socket.io ───
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(SERVER_URL, {
      auth: { token: token || '' },
    });

    const sock = socketRef.current;

    sock.on('new_appointment', (appointment) => {
      setAppointments(prev => [appointment, ...prev]);
      if ((location.pathname === '/admin' || location.pathname === '/berber') && audioEnabledRef.current) {
        playNotificationSound();
      }
    });

    sock.on('appointment_updated', (updated) => {
      setAppointments(prev => prev.map(app => app.id === updated.id ? updated : app));
    });

    sock.on('appointment_deleted', ({ id }) => {
      setAppointments(prev => prev.filter(app => app.id !== id));
    });

    return () => {
      sock.off('new_appointment');
      sock.off('appointment_updated');
      sock.off('appointment_deleted');
    };
  }, [token, location.pathname]);

  // ─── Fetch appointments ───
  useEffect(() => {
    if (token) {
      // Authenticated: fetch appointments with auth
      fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAppointments(Array.isArray(data) ? data : []))
        .catch(() => { });
    } else if (selectedBarber) {
      // Public: fetch availability for selected barber
      fetch(`${SERVER_URL}/api/appointments/availability?barberId=${selectedBarber}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAppointments(Array.isArray(data) ? data : []))
        .catch(() => { });
    }
  }, [token, selectedBarber]);


  // ─── Slots ───
  const generateSlots = () => {
    const slots = [];
    for (let h = 8; h < 20; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const isSlotTaken = (timeSlot, date) => {
    const targetDate = date || selectedDate;
    return appointments.some(app => {
      if (app.status === 'rejected') return false;
      // Filter by barber
      if (selectedBarber && app.barberId !== selectedBarber) return false;
      return new Date(app.time).toISOString() === new Date(`${targetDate}T${timeSlot}`).toISOString();
    });
  };

  const getSlotAppointment = (timeSlot, date) => {
    const targetDate = date || selectedDate;
    return appointments.find(app => {
      if (app.status === 'rejected') return false;
      // Filter by barber
      if (selectedBarber && app.barberId !== selectedBarber) return false;
      return new Date(app.time).toISOString() === new Date(`${targetDate}T${timeSlot}`).toISOString();
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    if (!selectedSlot) { setBookingError('Lütfen bir saat seçin.'); return; }
    if (!selectedBarber) { setBookingError('Lütfen bir berber seçin.'); return; }

    const res = await fetch(`${SERVER_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newAppointment,
        time: `${selectedDate}T${selectedSlot}`,
        barberId: selectedBarber
      })
    });
    if (res.ok) {
      setIsBooked(true);
      setNewAppointment(prev => ({ ...prev, name: '', phone: '' }));
      setSelectedSlot('');
      setTimeout(() => setIsBooked(false), 3000);
    } else {
      const data = await res.json();
      setBookingError(data.error || 'Randevu oluşturulamadı.');
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`${SERVER_URL}/api/appointments/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
  };

  const handleLogin = async (username, password) => {
    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
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

  // Check if user is admin
  const isAdmin = userRole === 'ADMIN';

  // ─── Render ───
  return (
    <div className="app-container">
      {location.pathname !== '/admin' && location.pathname !== '/berber' && (
        <nav className="navbar glass-panel">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <div style={{ padding: '0.4rem', background: 'linear-gradient(135deg, #ae8625, #f7ef8a)', borderRadius: '8px' }}>
              <Scissors style={{ color: '#000' }} size={20} />
            </div>
            <h1 className="brand-title gold-text" style={{ fontSize: '1.3rem' }}>HairMan Studio</h1>
          </motion.div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={15} />
              {t.bookStylist}
            </NavLink>
            {token && (
              <>
                {isAdmin ? (
                  <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Shield size={15} />
                    {t.adminDashboard}
                  </NavLink>
                ) : (
                  <NavLink to="/berber" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <User size={15} />
                    {t.barberDashboard}
                  </NavLink>
                )}
              </>
            )}
          </div>
        </nav>
      )}

      <main style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={
            <HomePage
              t={t}
              barbers={barbers}
              selectedBarber={selectedBarber}
              setSelectedBarber={setSelectedBarber}
              appointments={appointments}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              newAppointment={newAppointment}
              setNewAppointment={setNewAppointment}
              handleBooking={handleBooking}
              isBooked={isBooked}
              generateSlots={generateSlots}
              isSlotTaken={isSlotTaken}
              bookingError={bookingError}
              setBookingError={setBookingError}
            />
          } />

          {/* Barber Panel Route - Restricted to BARBER */}
          <Route path="/berber" element={
            <ProtectedRoute token={token} userRole={userRole} allowedRoles={['BARBER']} isRestoringSession={isRestoringSession}>
              <AdminPage
                t={t}
                appointments={appointments}
                updateStatus={updateStatus}
                audioEnabled={audioEnabled}
                toggleAudio={toggleAudio}
                soundType={soundType}
                setSoundType={setSoundType}
                playSynthBell={playSynthBell}
                playExternalFile={playExternalFile}
                generateSlots={generateSlots}
                isSlotTaken={isSlotTaken}
                getSlotAppointment={getSlotAppointment}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                token={token}
                onLogin={handleLogin}
                onLogout={handleLogout}
                authHeaders={authHeaders}
                currentUser={currentUser}
                userRole={userRole}
                barbers={barbers}
                isBarberPanel={true}
              />
            </ProtectedRoute>
          } />

          {/* Admin Dashboard Route - Restricted to ADMIN */}
          <Route path="/admin" element={
            <ProtectedRoute token={token} userRole={userRole} allowedRoles={['ADMIN']} isRestoringSession={isRestoringSession}>
              <AdminPage
                t={t}
                appointments={appointments}
                updateStatus={updateStatus}
                audioEnabled={audioEnabled}
                toggleAudio={toggleAudio}
                soundType={soundType}
                setSoundType={setSoundType}
                playSynthBell={playSynthBell}
                playExternalFile={playExternalFile}
                generateSlots={generateSlots}
                isSlotTaken={isSlotTaken}
                getSlotAppointment={getSlotAppointment}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                token={token}
                onLogin={handleLogin}
                onLogout={handleLogout}
                authHeaders={authHeaders}
                currentUser={currentUser}
                userRole={userRole}
                barbers={barbers}
                isAdminPanel={true}
              />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
