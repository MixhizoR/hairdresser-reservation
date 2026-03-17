import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, User, Phone, Scissors, Clock, Lock, ShieldCheck, Shield, Calendar, LogOut, UserPlus, Trash2, Edit } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';


export default function AdminPage({
  t, appointments, updateStatus, audioEnabled, toggleAudio, soundType, setSoundType,
  playSynthBell, playExternalFile, generateSlots, isSlotTaken, getSlotAppointment,
  selectedDate, setSelectedDate, token, onLogin, onLogout, authHeaders,
  currentUser, userRole, barbers, isAdminPanel, isBarberPanel
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [soundFiles, setSoundFiles] = useState([]);
  const [adminDate, setAdminDate] = useState(new Date().toISOString().split('T')[0]);
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('BARBER');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regMessage, setRegMessage] = useState('');

  // Barber management state (admin only)
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [barberForm, setBarberForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [barberList, setBarberList] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);

  const isAuthenticated = !!token;
  const isAdmin = userRole === 'ADMIN';

  // Determine which panel type
  const isAdminView = isAdminPanel || isAdmin;
  const panelTitle = isAdminView ? t.adminDashboard : t.barberDashboard;

  useEffect(() => {
    fetch(`${SERVER_URL}/api/sounds`)
      .then(res => res.json())
      .then(data => setSoundFiles(data.files || []))
      .catch(() => setSoundFiles([]));
  }, []);

  // Fetch barbers for admin
  useEffect(() => {
    if (isAdminView && token) {
      fetch(`${SERVER_URL}/api/barbers/all`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => setBarberList(data))
        .catch(() => { });
    }
  }, [isAdminView, token]);

  // Fetch dashboard stats for admin
  useEffect(() => {
    if (isAdminView && token) {
      fetch(`${SERVER_URL}/api/auth/dashboard`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setStats(data.stats);
          setBarberList(data.barbers || []);
        })
        .catch(() => { });
    }
  }, [isAdminView, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const result = await onLogin(username, password);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.error || 'Giriş başarısız.');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage('');
    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        username: regUsername,
        password: regPassword,
        role: regRole,
        name: regName,
        phone: regPhone
      })
    });
    const data = await res.json();
    if (res.ok) {
      setRegMessage(`✅ "${regUsername}" başarıyla eklendi.`);
      setRegUsername(''); setRegPassword(''); setRegName(''); setRegPhone('');
      // Refresh barber list
      fetch(`${SERVER_URL}/api/barbers/all`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => setBarberList(data))
        .catch(() => { });
    } else {
      setRegMessage(`❌ ${data.error}`);
    }
  };

  // Handle barber CRUD
  const handleSaveBarber = async () => {
    const url = editingBarber ? `${SERVER_URL}/api/barbers/${editingBarber.id}` : `${SERVER_URL}/api/barbers`;
    const method = editingBarber ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(barberForm)
    });
    const data = await res.json();
    if (res.ok) {
      setShowBarberModal(false);
      setEditingBarber(null);
      setBarberForm({ username: '', password: '', name: '', phone: '' });
      // Refresh list
      fetch(`${SERVER_URL}/api/barbers/all`, { headers: authHeaders() })
        .then(res => res.ok ? res.json() : [])
        .then(data => setBarberList(data))
        .catch(() => { });
    } else {
      alert(data.error || 'Bir hata oluştu');
    }
  };

  const handleToggleBarber = async (id, currentStatus) => {
    await fetch(`${SERVER_URL}/api/barbers/${id}/toggle`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    // Refresh list
    fetch(`${SERVER_URL}/api/barbers/all`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : [])
      .then(data => setBarberList(data))
      .catch(() => { });
  };

  const handleDeleteBarber = async (id) => {
    if (!confirm('Bu berberi silmek istediğinizden emin misiniz?')) return;
    await fetch(`${SERVER_URL}/api/barbers/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    // Refresh list
    fetch(`${SERVER_URL}/api/barbers/all`, { headers: authHeaders() })
      .then(res => res.ok ? res.json() : [])
      .then(data => setBarberList(data))
      .catch(() => { });
  };

  // Filter appointments based on role
  const filteredAppointments = isAdminView
    ? appointments
    : appointments.filter(a => a.barberId === currentUser?.id);

  // ─── Login Form ───
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="login-card glass-panel">
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            {isAdminView ? <Shield size={24} style={{ color: 'var(--primary)' }} /> : <Scissors size={24} style={{ color: 'var(--primary)' }} />}
          </div>
          <h2 className="gold-text">{isAdminView ? 'Admin Girişi' : 'Berber Girişi'}</h2>
          <p>Devam etmek için kullanıcı bilgilerinizi girin</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <div>
              <label className="form-label">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="form-input"
                placeholder="admin veya berber1"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="form-label">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                autoFocus
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn-premium"
              style={{ width: '100%', marginTop: '0.5rem', opacity: loginLoading ? 0.7 : 1 }}
              disabled={loginLoading}
            >
              <ShieldCheck size={18} />
              {loginLoading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
            </motion.button>
          </form>
          {loginError && <p className="login-error">{loginError}</p>}
        </motion.div>
      </div>
    );
  }

  // ─── Dashboard ───
  const finalFilteredApps = filter === 'all' ? filteredAppointments : filteredAppointments.filter(a => a.status === filter);
  const counts = {
    all: filteredAppointments.length,
    pending: filteredAppointments.filter(a => a.status === 'pending').length,
    approved: filteredAppointments.filter(a => a.status === 'approved').length,
    rejected: filteredAppointments.filter(a => a.status === 'rejected').length,
    completed: filteredAppointments.filter(a => a.status === 'completed').length
  };
  const slots = generateSlots();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 1600, margin: '0 auto', padding: '0 1.5rem 1.5rem' }}>

      {/* ─── Header ─── */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.4rem', background: 'linear-gradient(135deg, #ae8625, #f7ef8a)', borderRadius: '8px' }}>
            {isAdminView ? <Shield style={{ color: '#000' }} size={20} /> : <Scissors style={{ color: '#000' }} size={20} />}
          </div>
          <div>
            <h2 className="gold-text brand-title" style={{ fontSize: '1.6rem' }}>{panelTitle}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {currentUser?.name || localStorage.getItem('noir_admin_user') || 'Admin'} — {isAdminView ? 'Sistem Yönetimi' : t.managingClientele}
            </p>
          </div>
        </div>

        <div className="dashboard-controls">
          {/* Admin Stats Toggle */}
          {isAdminView && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowStats(!showStats)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              📊 İstatistikler
            </motion.button>
          )}

          {/* Audio Toggle */}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleAudio}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${audioEnabled ? 'rgba(0,242,96,0.3)' : 'rgba(255,75,43,0.3)'}`, background: audioEnabled ? 'rgba(0,242,96,0.08)' : 'rgba(255,75,43,0.08)', color: audioEnabled ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            <Bell size={14} />
            {audioEnabled ? t.systemAudible : t.activateVoice}
          </motion.button>

          {/* Sound Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
            <select value={soundType} onChange={(e) => { setSoundType(e.target.value); localStorage.setItem('noir_sound_type', e.target.value); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
              <option value="synth" style={{ background: 'var(--bg-card)' }}>🔔 Dahili Çan</option>
              {soundFiles.map(file => <option key={file} value={file} style={{ background: 'var(--bg-card)' }}>🎵 {file}</option>)}
            </select>
            <button onClick={() => soundType === 'synth' ? playSynthBell() : playExternalFile(soundType)}
              style={{ padding: '0.35rem 0.75rem', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--primary)', fontSize: '0.6rem', fontWeight: 800, borderRadius: 'var(--radius-sm)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--sans)' }}>
              TEST
            </button>
          </div>

          {/* Live */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-border 2s infinite' }} />
            {t.liveOpsActive}
          </div>

          {/* Logout */}
          <button onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            <LogOut size={14} /> Çıkış
          </button>
        </div>
      </div>

      {/* ─── Admin Stats Panel ─── */}
      {isAdminView && showStats && stats && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 className="gold-text" style={{ marginBottom: '1rem', fontFamily: 'var(--serif)' }}>📊 Genel İstatistikler</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.totalAppointments}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Toplam Randevu</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffa500' }}>{stats.pendingAppointments}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bekleyen</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{stats.todayAppointments}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bugün</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.activeBarbers}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Aktif Berber</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Side-by-Side: Admin Panels + Appointments ─── */}
      <div className="admin-grid">

        {/* LEFT: Admin Controls or Slot Grid */}
        <div>
          {/* Admin: Barber Management */}
          {isAdminView ? (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="gold-text" style={{ fontFamily: 'var(--serif)', fontSize: '0.9rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} /> Berber Yönetimi
                </h3>
                <button onClick={() => { setShowRegister(!showRegister); setEditingBarber(null); setBarberForm({ username: '', password: '', name: '', phone: '' }); }}
                  style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--primary)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>
                  + Yeni Berber
                </button>
              </div>

              {/* Barber List */}
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {barberList.map(barber => (
                  <div key={barber.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{barber.name || barber.username}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{barber.phone || 'Telefon yok'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <button onClick={() => { setEditingBarber(barber); setBarberForm({ username: barber.username, password: '', name: barber.name || '', phone: barber.phone || '' }); setShowBarberModal(true); }}
                        style={{ padding: '0.35rem', background: 'rgba(212,175,55,0.1)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--primary)' }}>
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleToggleBarber(barber.id, barber.isActive)}
                        style={{ padding: '0.35rem', background: barber.isActive ? 'rgba(0,242,96,0.1)' : 'rgba(255,75,43,0.1)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: barber.isActive ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '0.65rem' }}>
                        {barber.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                      <button onClick={() => handleDeleteBarber(barber.id)}
                        style={{ padding: '0.35rem', background: 'rgba(255,68,68,0.1)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--accent-red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {barberList.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Henüz berber bulunmuyor.</p>}
              </div>

              {/* Quick Add Form */}
              {showRegister && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>Hızlı Ekle</h4>
                  <form onSubmit={handleRegister} style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
                    <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} className="form-input" placeholder="Kullanıcı adı" style={{ padding: '0.5rem', fontSize: '0.75rem' }} required />
                    <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="form-input" placeholder="Şifre" style={{ padding: '0.5rem', fontSize: '0.75rem' }} required />
                    <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="form-input" placeholder="İsim" style={{ padding: '0.5rem', fontSize: '0.75rem' }} />
                    <input type="text" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="form-input" placeholder="Telefon" style={{ padding: '0.5rem', fontSize: '0.75rem' }} />
                    <select value={regRole} onChange={e => setRegRole(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.75rem', background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <option value="BARBER">Berber</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button type="submit" className="btn-premium" style={{ padding: '0.5rem', fontSize: '0.7rem' }}>EKLE</button>
                  </form>
                  {regMessage && <p style={{ fontSize: '0.7rem', color: regMessage.startsWith('✅') ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '0.5rem', gridColumn: '1 / -1' }}>{regMessage}</p>}
                </div>
              )}
            </div>
          ) : (
            /* Barber: Slot Grid */
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="gold-text" style={{ fontFamily: 'var(--serif)', fontSize: '0.9rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} /> {t.slotOverview}
                </h3>
                <input type="date" value={adminDate} onChange={e => setAdminDate(e.target.value)} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', width: 'auto' }} />
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(0,242,96,0.3)', border: '1px solid rgba(0,242,96,0.4)' }} />{t.available}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,165,0,0.35)', border: '1px solid rgba(255,165,0,0.5)' }} />Bekliyor</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,75,43,0.3)', border: '1px solid rgba(255,75,43,0.4)' }} />{t.booked}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {slots.map(slot => {
                  const slotApp = getSlotAppointment(slot, adminDate);
                  const status = slotApp ? slotApp.status : 'available';

                  const colors = {
                    available: { border: 'rgba(0,242,96,0.2)', bg: 'rgba(0,242,96,0.03)', text: 'var(--accent-green)' },
                    pending: { border: 'rgba(255,165,0,0.4)', bg: 'rgba(255,165,0,0.07)', text: '#ffa500' },
                    approved: { border: 'rgba(255,75,43,0.35)', bg: 'rgba(255,75,43,0.07)', text: 'var(--accent-red)' },
                    rejected: { border: 'rgba(255,75,43,0.35)', bg: 'rgba(255,75,43,0.07)', text: 'var(--accent-red)' },
                    completed: { border: 'rgba(0,242,96,0.35)', bg: 'rgba(0,242,96,0.07)', text: 'var(--accent-green)' },
                  };
                  const c = colors[status] || colors.available;

                  return (
                    <div key={slot} title={slotApp ? `${slotApp.name} — ${slotApp.service}` : 'Müsait'}
                      style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${c.border}`, background: c.bg, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: c.text, fontFamily: 'var(--sans)' }}>{slot}</div>
                      {status === 'available' && <div style={{ fontSize: '0.5rem', color: 'rgba(0,242,96,0.45)', marginTop: '0.15rem' }}>✓ {t.available}</div>}
                      {status === 'pending' && <div style={{ fontSize: '0.5rem', color: '#ffa500', marginTop: '0.15rem', opacity: 0.9 }}>⏳ Bekliyor</div>}
                      {(status === 'approved' || status === 'rejected' || status === 'completed') && slotApp &&
                        <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slotApp.name}</div>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Appointment List */}
        <div>
          <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
            {['all', 'pending', 'approved', 'rejected', 'completed'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tümü' : f === 'pending' ? t.pending : f === 'approved' ? t.approved : f === 'rejected' ? t.rejected : t.completed}
                <span className="count">{counts[f]}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <AnimatePresence>
              {finalFilteredApps.map((app) => (
                <motion.div key={app.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`glass-panel appointment-card ${app.status}`}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                      <User size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</h3>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={11} /> {app.phone}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Scissors size={11} /> {app.service}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} />
                          {app.time && !isNaN(new Date(app.time).getTime()) ? new Date(app.time).toLocaleString('tr-TR') : t.timeNotSet}
                        </span>
                        {isAdminView && app.barber && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                            <User size={11} /> {app.barber.name || app.barber.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                    {app.status === 'pending' && (
                      <>
                        <button className="action-btn approve" onClick={() => updateStatus(app.id, 'approved')} title={t.approve}><Check size={16} /></button>
                        <button className="action-btn reject" onClick={() => updateStatus(app.id, 'rejected')} title={t.reject}><X size={16} /></button>
                      </>
                    )}
                    {app.status === 'approved' && (
                      <button className="action-btn approve" onClick={() => updateStatus(app.id, 'completed')} title={t.complete} style={{ background: 'rgba(0,242,96,0.2)' }}>✓</button>
                    )}
                    {app.status !== 'pending' && (
                      <span className={`status-badge ${app.status}`}>
                        {app.status === 'approved' ? t.approved : app.status === 'rejected' ? t.rejected : t.completed}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {finalFilteredApps.length === 0 && (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-dim)' }}>Henüz randevu bulunamadı.</div>
            )}
          </div>
        </div>
      </div>

      {/* Barber Edit Modal */}
      {showBarberModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '90%' }}>
            <h3 className="gold-text" style={{ marginBottom: '1rem' }}>Berber Düzenle</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <input type="text" value={barberForm.username} onChange={e => setBarberForm({ ...barberForm, username: e.target.value })} className="form-input" placeholder="Kullanıcı adı" disabled={!!editingBarber} />
              <input type="text" value={barberForm.name} onChange={e => setBarberForm({ ...barberForm, name: e.target.value })} className="form-input" placeholder="İsim" />
              <input type="text" value={barberForm.phone} onChange={e => setBarberForm({ ...barberForm, phone: e.target.value })} className="form-input" placeholder="Telefon" />
              <input type="password" value={barberForm.password} onChange={e => setBarberForm({ ...barberForm, password: e.target.value })} className="form-input" placeholder="Yeni şifre (boş = değişmez)" />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => { setShowBarberModal(false); setEditingBarber(null); }} className="btn-premium" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>İptal</button>
                <button onClick={handleSaveBarber} className="btn-premium" style={{ flex: 1 }}>Kaydet</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
