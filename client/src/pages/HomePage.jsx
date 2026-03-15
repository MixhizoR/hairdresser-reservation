import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Calendar, Check, Crown, Flame, Star } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } })
};

// Phone validation: 05xxxxxxxxx format (Turkish mobile)
const isValidPhone = (phone) => /^05\d{9}$/.test(phone);

export default function HomePage({ t, appointments, selectedDate, setSelectedDate, selectedSlot, setSelectedSlot, newAppointment, setNewAppointment, handleBooking, isBooked, generateSlots, isSlotTaken, bookingError, setBookingError }) {

  const [phoneError, setPhoneError] = useState('');
  const [honeypot, setHoneypot] = useState(''); // honeypot field

  const serviceIcons = [<Scissors size={22} />, <Crown size={22} />, <Flame size={22} />, <Star size={22} />];
  const servicePrices = ['₺150', '₺120', '₺200', '₺350'];
  const serviceDescs = [
    'Uzman stilistler ile kişiye özel kesim',
    'İmza detaylarla sakal bakımı',
    'Geleneksel sıcak havlu ritüeli',
    'Premium saç, sakal ve bakım paketi'
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
          <motion.h1 custom={1} variants={fadeUp} className="hero-title gold-text">Noir Barber</motion.h1>
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
            <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

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
              <div>
                <label className="form-label">{t.selectArt}</label>
                <select value={newAppointment.service} onChange={e => setNewAppointment({ ...newAppointment, service: e.target.value })} className="form-input" style={{ appearance: 'none', background: 'var(--bg-card)' }}>
                  {t.services.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t.preferredSchedule}</label>
                <input required type="date" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setBookingError(''); setSelectedSlot(''); }} className="form-input" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ marginBottom: '0.75rem' }}>{t.selectTimeSlot}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                  {generateSlots().map(slot => {
                    const taken = isSlotTaken(slot);
                    return (
                      <button key={slot} type="button" disabled={taken} onClick={() => { setSelectedSlot(slot); setBookingError(''); }} className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {bookingError && (
                <div style={{ gridColumn: 'span 2', color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(255, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                  {bookingError}
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-premium" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                {isBooked ? <Check size={20} /> : <Calendar size={20} />}
                {isBooked ? t.reservationSent : t.requestAppointment}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '3rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          © 2026 Noir Barber — Tüm Hakları Saklıdır
        </p>
      </footer>
    </>
  );
}
