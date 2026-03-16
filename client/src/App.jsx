import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Scissors, Calendar } from 'lucide-react';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

// In development, this uses localhost:5000. In prod, it falls back to empty string (meaning relative path '/api')
const SERVER_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ name: '', phone: '', service: 'Saç Kesim & Stil', time: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [soundType, setSoundType] = useState(localStorage.getItem('noir_sound_type') || 'synth');
  const [token, setToken] = useState(sessionStorage.getItem('noir_token') || null);
  const location = useLocation();

  const socketRef = useRef(null);

  const t = {
    brand: 'Noir Barber',
    bookStylist: 'Randevu Al',
    secureSlot: 'Randevu Oluştur',
    experienceArt: 'Gece yarısı mabedimizde bakım sanatını deneyimleyin.',
    clientName: 'Müşteri Adı',
    clientNamePlaceholder: 'Örn: Alexander Noir',
    contactPhone: 'İletişim Telefonu',
    selectArt: 'Hizmetlerimiz',
    preferredSchedule: 'Tarih Seçin',
    selectTimeSlot: 'Saat Dilimi Seçin',
    requestAppointment: 'RANDEVU TALEBİ GÖNDER',
    reservationSent: 'RANDEVU GÖNDERİLDİ',
    conciergeDashboard: 'Yönetici Paneli',
    managingClientele: 'Premium müşteri yönetimi',
    systemAudible: 'SES AKTİF',
    activateVoice: 'SESİ ETKİNLEŞTİR',
    liveOpsActive: 'CANLI TAKİP AKTİF',
    timeNotSet: 'Zaman ayarlanmadı',
    services: ['Saç Kesim & Stil', 'İmza Sakal Düzeltme', 'Kraliyet Sıcak Havlu Tıraşı', 'Noir Deneyimi'],
    approved: 'ONAYLANDI',
    pending: 'BEKLEMEDE',
    rejected: 'REDDEDİLDİ',
    approve: 'Onayla',
    reject: 'Reddet',
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

  // ─── Socket.io (reconnect when token changes) ───
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
      if (location.pathname === '/admin' && audioEnabledRef.current) playNotificationSound();
    });

    sock.on('appointment_updated', ({ id, status }) => {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    });

    return () => { sock.off('new_appointment'); sock.off('appointment_updated'); };
  }, [token]);

  // ─── Fetch appointments ───
  useEffect(() => {
    if (token) {
      // Admin: fetch full list with auth
      fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAppointments(Array.isArray(data) ? data : []))
        .catch(() => { });
    } else {
      // Public: fetch slim availability only (no PII)
      fetch(`${SERVER_URL}/api/appointments/availability`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAppointments(Array.isArray(data) ? data : []))
        .catch(() => { });
    }
  }, [token]);


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
      return new Date(app.time).toISOString() === new Date(`${targetDate}T${timeSlot}`).toISOString();
    });
  };

  const getSlotAppointment = (timeSlot, date) => {
    const targetDate = date || selectedDate;
    return appointments.find(app => {
      if (app.status === 'rejected') return false;
      return new Date(app.time).toISOString() === new Date(`${targetDate}T${timeSlot}`).toISOString();
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    if (!selectedSlot) { setBookingError('Lütfen bir saat seçin.'); return; }
    const res = await fetch(`${SERVER_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAppointment, time: `${selectedDate}T${selectedSlot}` })
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
    const res = await fetch(`${SERVER_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      sessionStorage.setItem('noir_token', data.token);
      sessionStorage.setItem('noir_admin_user', data.username);
      setToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'Giriş başarısız.' };
  };

  const handleLogout = () => {
    sessionStorage.removeItem('noir_token');
    sessionStorage.removeItem('noir_admin_user');
    setToken(null);
    setAppointments([]);
  };

  // ─── Render ───
  return (
    <div className="app-container">
      {location.pathname !== '/admin' && (
        <nav className="navbar glass-panel">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <div style={{ padding: '0.4rem', background: 'linear-gradient(135deg, #ae8625, #f7ef8a)', borderRadius: '8px' }}>
              <Scissors style={{ color: '#000' }} size={20} />
            </div>
            <h1 className="brand-title gold-text" style={{ fontSize: '1.3rem' }}>Noir Barber</h1>
          </motion.div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={15} />
              {t.bookStylist}
            </NavLink>
          </div>
        </nav>
      )}

      <main style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={
            <HomePage
              t={t} appointments={appointments}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
              newAppointment={newAppointment} setNewAppointment={setNewAppointment}
              handleBooking={handleBooking} isBooked={isBooked}
              generateSlots={generateSlots} isSlotTaken={isSlotTaken}
              bookingError={bookingError} setBookingError={setBookingError}
            />
          } />
          <Route path="/admin" element={
            <AdminPage
              t={t} appointments={appointments}
              updateStatus={updateStatus}
              audioEnabled={audioEnabled} toggleAudio={toggleAudio}
              soundType={soundType} setSoundType={setSoundType}
              playSynthBell={playSynthBell} playExternalFile={playExternalFile}
              generateSlots={generateSlots} isSlotTaken={isSlotTaken}
              getSlotAppointment={getSlotAppointment}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              token={token} onLogin={handleLogin} onLogout={handleLogout}
              authHeaders={authHeaders}
            />
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
