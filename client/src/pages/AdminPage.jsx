import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, User, Phone, Scissors, Clock, Lock, ShieldCheck, Calendar, LogOut, UserPlus } from 'lucide-react';

const SERVER_URL = `http://${window.location.hostname}:5000`;

export default function AdminPage({ t, appointments, updateStatus, audioEnabled, toggleAudio, soundType, setSoundType, playSynthBell, playExternalFile, generateSlots, isSlotTaken, getSlotAppointment, selectedDate, setSelectedDate, token, onLogin, onLogout, authHeaders }) {
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
  const [regMessage, setRegMessage] = useState('');

  const isAuthenticated = !!token;

  useEffect(() => {
    fetch(`${SERVER_URL}/api/sounds`)
      .then(res => res.json())
      .then(data => setSoundFiles(data.files || []))
      .catch(() => setSoundFiles([]));
  }, []);

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
    const res = await fetch(`${SERVER_URL}/api/admin/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ username: regUsername, password: regPassword })
    });
    const data = await res.json();
    if (res.ok) {
      setRegMessage(`✅ "${regUsername}" başarıyla eklendi.`);
      setRegUsername(''); setRegPassword('');
    } else {
      setRegMessage(`❌ ${data.error}`);
    }
  };

  // ─── Login Form ───
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="login-card glass-panel">
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Lock size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 className="gold-text">Yönetici Girişi</h2>
          <p>Devam etmek için kullanıcı bilgilerinizi girin</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <div>
              <label className="form-label">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="form-input"
                placeholder="admin"
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
  const filteredApps = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    approved: appointments.filter(a => a.status === 'approved').length,
    rejected: appointments.filter(a => a.status === 'rejected').length
  };
  const slots = generateSlots();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem' }}>

      {/* ─── Header ─── */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.4rem', background: 'linear-gradient(135deg, #ae8625, #f7ef8a)', borderRadius: '8px' }}>
            <Scissors style={{ color: '#000' }} size={20} />
          </div>
          <div>
            <h2 className="gold-text brand-title" style={{ fontSize: '1.6rem' }}>{t.conciergeDashboard}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {sessionStorage.getItem('noir_admin_user')} — {t.managingClientele}
            </p>
          </div>
        </div>

        <div className="dashboard-controls">
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

      {/* ─── Side-by-Side: Slot Grid + Appointments ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT: Slot Grid */}
        <div>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 className="gold-text" style={{ fontFamily: 'var(--serif)', fontSize: '0.9rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> {t.slotOverview}
              </h3>
              <input type="date" value={adminDate} onChange={e => setAdminDate(e.target.value)} className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(0,242,96,0.3)', border: '1px solid rgba(0,242,96,0.4)' }} />{t.available}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,75,43,0.3)', border: '1px solid rgba(255,75,43,0.4)' }} />{t.booked}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {slots.map(slot => {
                const taken = isSlotTaken(slot, adminDate);
                const slotApp = taken ? getSlotAppointment(slot, adminDate) : null;
                return (
                  <div key={slot} title={slotApp ? `${slotApp.name} — ${slotApp.service}` : 'Müsait'}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${taken ? 'rgba(255,75,43,0.35)' : 'rgba(0,242,96,0.2)'}`, background: taken ? 'rgba(255,75,43,0.07)' : 'rgba(0,242,96,0.03)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: taken ? 'var(--accent-red)' : 'var(--accent-green)', fontFamily: 'var(--sans)' }}>{slot}</div>
                    {slotApp ? (
                      <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slotApp.name}</div>
                    ) : (
                      <div style={{ fontSize: '0.5rem', color: 'rgba(0,242,96,0.45)', marginTop: '0.15rem' }}>✓ {t.available}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Add Admin ─── */}
          <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <button onClick={() => setShowRegister(!showRegister)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: showRegister ? '1rem' : 0 }}>
              <UserPlus size={14} /> Yeni Yönetici Ekle
            </button>
            {showRegister && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} className="form-input" placeholder="Kullanıcı adı" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} required />
                <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="form-input" placeholder="Şifre (min 8 karakter)" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} required />
                <button type="submit" className="btn-premium" style={{ padding: '0.5rem', fontSize: '0.7rem' }}>EKLE</button>
                {regMessage && <p style={{ fontSize: '0.7rem', color: regMessage.startsWith('✅') ? 'var(--accent-green)' : 'var(--accent-red)', marginTop: '0.25rem' }}>{regMessage}</p>}
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: Appointment List */}
        <div>
          <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tümü' : f === 'pending' ? t.pending : f === 'approved' ? t.approved : t.rejected}
                <span className="count">{counts[f]}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <AnimatePresence>
              {filteredApps.map((app) => (
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
                    {app.status !== 'pending' && (
                      <span className={`status-badge ${app.status}`}>{app.status === 'approved' ? t.approved : t.rejected}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredApps.length === 0 && (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-dim)' }}>Henüz randevu bulunamadı.</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
