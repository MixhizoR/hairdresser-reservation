import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Calendar, Check, Crown, Flame, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } })
};

// Phone validation: 05xxxxxxxxx format (Turkish mobile)
const isValidPhone = (phone) => /^05\d{9}$/.test(phone);

export default function HomePage({ t, barbers, selectedBarber, setSelectedBarber, appointments, selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, newAppointment, setNewAppointment, handleBooking, isBooked, generateSlots, isSlotTaken, bookingError, setBookingError }) {

  const [phoneError, setPhoneError] = useState('');
  const [honeypot, setHoneypot] = useState(''); // honeypot field
  const [showSlots, setShowSlots] = useState(false);

  const isPastHour = (slot) => {
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    if (selectedDate === todayStr) {
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const nowHour = now.getHours();
      const nowMin = now.getMinutes();
      return slotHour < nowHour || (slotHour === nowHour && slotMin <= nowMin);
    }
    return false;
  };

  const serviceIcons = [
    <Scissors size={22} />, <Scissors size={22} />, <Scissors size={22} />,
    <Star size={22} />, <Flame size={22} />, <Scissors size={22} />,
    <Flame size={22} />, <Flame size={22} />, <Crown size={22} />, <Star size={22} />
  ];
  const servicePrices = ['₺400', '₺200', '₺500', '₺300', '₺400', '₺200', '₺250', '₺150', '₺2000', '₺1000'];
  const serviceDescs = [
    'Profesyonel saç kesimi',
    'Detaylı sakal şekillendirme',
    'Tam bakım: Saç ve sakal',
    'Çocuklar için özel tıraş',
    'Yenileyici cilt bakımı',
    'Kaş şekillendirme ve alımı',
    'Profesyonel fön çekimi',
    'Ağda ile istenmeyen tüylere son',
    'Düğün gününe özel eksiksiz bakım',
    'Adresinize özel VIP tıraş hizmeti'
  ];

  const onPhoneChange = (e) => {
    const val = e.target.value;
    setNewAppointment({ ...newAppointment, phone: val });
    if (val.length > 0 && !isValidPhone(val)) {
      setPhoneError('Format: 05xxxxxxxxx (11 rakam)');
    } else {
      setPhoneError('');
    }
  };

  const onSubmit = (e) => {
    if (!isValidPhone(newAppointment.phone)) {
      setPhoneError('Geçerli bir telefon numarası girin. Format: 05xxxxxxxxx');
      e.preventDefault();
      return;
    }
    handleBooking(e);
  };

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="hero-section">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ position: 'absolute', top: '3rem', right: '10%', opacity: 0.06 }}>
          <Scissors size={200} style={{ color: 'var(--primary)', animation: 'float 6s ease-in-out infinite' }} />
        </motion.div>

        <motion.div initial="hidden" animate="visible" style={{ position: 'relative', zIndex: 10 }}>
          <motion.p custom={0} variants={fadeUp} style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--primary)', fontWeight: 700, marginBottom: '1rem' }}>
            — PREMIUM BAKIM DENEYİMİ —
          </motion.p>
          <motion.h1 custom={1} variants={fadeUp} className="hero-title gold-text">HairMan Studio</motion.h1>
          <div className="hero-divider" />
          <motion.p custom={2} variants={fadeUp} className="hero-subtitle">{t.experienceArt}</motion.p>
          <motion.a custom={3} variants={fadeUp} href="#booking" className="btn-premium" whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Calendar size={18} />RANDEVU TALEBİ
          </motion.a>
        </motion.div>
      </section>

      {/* ─── Services ─── */}
      <section style={{ padding: '2rem 0 3rem' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="section-title">
          <motion.h2 custom={0} variants={fadeUp} className="gold-text">{t.selectArt}</motion.h2>
          <motion.p custom={1} variants={fadeUp}>Her biri bir sanat eseri</motion.p>
        </motion.div>
        <div className="services-grid">
          {t.services.map((service, i) => (
            <motion.div key={service} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="service-card">
              <div className="service-card-icon">{serviceIcons[i]}</div>
              <h3>{service}</h3>
              <p>{serviceDescs[i]}</p>
              <span className="price">{servicePrices[i]}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Booking ─── */}
      <section id="booking" style={{ padding: '2rem 0' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="section-title">
          <motion.h2 custom={0} variants={fadeUp} className="gold-text">{t.secureSlot}</motion.h2>
          <motion.p custom={1} variants={fadeUp}>{t.experienceArt}</motion.p>
        </motion.div>

        <div className="booking-section">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="glass-panel" style={{ padding: '2.5rem' }}>
            <form onSubmit={onSubmit} className="booking-form-grid">

              {/* ── Honeypot (hidden from real users) ── */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                <input tabIndex="-1" type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t.clientName}</label>
                <input required type="text" value={newAppointment.name} onChange={e => setNewAppointment({ ...newAppointment, name: e.target.value })} className="form-input" placeholder={t.clientNamePlaceholder} minLength={2} maxLength={50} />
              </div>
              <div>
                <label className="form-label">{t.contactPhone}</label>
                <input required type="tel" value={newAppointment.phone} onChange={onPhoneChange} className="form-input" placeholder="05xxxxxxxxx" maxLength={11} />
                {phoneError && <p style={{ color: 'var(--accent-red)', fontSize: '0.65rem', marginTop: '0.3rem' }}>{phoneError}</p>}
              </div>
              {/* Barber Selection */}
              <div>
                <label className="form-label">{t.selectBarber || 'Berber Seçin'}</label>
                <select
                  value={selectedBarber}
                  onChange={e => { setSelectedBarber(e.target.value); setSelectedSlot(''); setShowSlots(false); }}
                  className="form-input"
                  style={{ appearance: 'none', background: 'var(--bg-card)' }}
                  required
                >
                  {barbers.map(barber => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name || barber.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t.selectArt}</label>
                <select value={newAppointment.service} onChange={e => setNewAppointment({ ...newAppointment, service: e.target.value })} className="form-input" style={{ appearance: 'none', background: 'var(--bg-card)' }}>
                  {t.services.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">{t.preferredSchedule}</label>
                  <input required type="date" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setBookingError(''); setSelectedSlot(''); setShowSlots(false); }} className="form-input" />
                </div>
                <button type="button" className="btn-premium" style={{ padding: '0.9rem 1.5rem', flexShrink: 0 }} onClick={() => setShowSlots(true)}>
                  Saatleri Listele
                </button>
              </div>

              {showSlots && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ marginBottom: '0.75rem' }}>{t.selectTimeSlot}</label>
                  <div className="slot-grid">
                    {generateSlots().map(slot => {
                      const taken = isSlotTaken(slot);
                      const past = isPastHour(slot);
                      const disabled = taken || past;
                      return (
                        <button key={slot} type="button" disabled={disabled} onClick={() => { setSelectedSlot(slot); setBookingError(''); }} className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}>
                          {slot}
                          {(taken || past) && (
                            <span style={{ display: 'block', fontSize: '0.65rem', marginTop: '2px', opacity: 0.8 }}>
                              {taken ? 'Dolu' : 'Geçti'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {bookingError && (
                <div style={{ gridColumn: 'span 2', color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(255, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                  {bookingError}
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-premium" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                <Calendar size={20} />
                {t.requestAppointment}
              </motion.button>
            </form>

            {isBooked && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(0,242,96,0.25)',
                  background: 'rgba(0,242,96,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <Check size={20} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-green)' }}>
                    {t.reservationSent}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Talebiniz alındı, berberden onay bekleniyor.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>


      <footer style={{ textAlign: 'center', padding: '3rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
          <strong>Lise Caddesi Vali Konağı Karşısı M. Pazar Apartmanı, Kat: 1 No: 2</strong><br />
          66100 Yozgat Merkez / Yozgat
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          © 2026 HairMan Studio — Tüm Hakları Saklıdır
        </p>
      </footer>
    </>
  );
}
