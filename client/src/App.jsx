import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Calendar, Bell, Check, X, User, Phone, Clock } from 'lucide-react';

const SERVER_URL = `http://${window.location.hostname}:5000`;
const socket = io(SERVER_URL);

function App() {
  const [view, setView] = useState('customer'); // 'customer' or 'admin'
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ name: '', phone: '', service: 'Saç Kesim & Stil', time: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [lang, setLang] = useState('tr');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('');

  const translations = {
    tr: {
      selectArt: 'Hizmet Seçin',
      preferredSchedule: 'Tarih Seçin',
      selectTimeSlot: 'Saat Dilimi Seçin',
      requestAppointment: 'RANDEVU TALEBİ GÖNDER',
      reservationSent: 'RANDEVU GÖNDERİLDİ',
      conciergeDashboard: 'Konsiyerj Paneli',
      managingClientele: 'Premium müşteri yönetimi',
      systemAudible: 'SES AKTİF',
      activateVoice: 'SESİ ETKİNLEŞTİR',
      liveOpsActive: 'CANLI TAKİP AKTİF',
      timeNotSet: 'Zaman ayarlanmadı',
      services: ['Saç Kesim & Stil', 'İmza Sakal Düzeltme', 'Kraliyet Sıcak Havlu Tıraşı', 'Noir Deneyimi'],
      adminAccessTitle: 'Yönetici Erişimi',
      approved: 'ONAYLANDI',
      pending: 'BEKLEMEDE',
      rejected: 'REDDEDİLDİ',
      approve: 'Onayla',
      reject: 'Reddet',
      invalidTime: 'Randevular sadece yarım saatlik dilimlerde (örn. 12:00, 12:30) alınabilir.',
      slotBooked: 'Bu saat dilimi dolu.',
      selectDateFirst: 'Önce bir tarih seçmelisiniz.'
    },
    en: {
      brand: 'Noir Barber',
      bookStylist: 'Book Stylist',
      adminAccess: 'Admin Access',
      secureSlot: 'Secure a Slot',
      experienceArt: 'Experience the art of grooming in our midnight sanctuary.',
      clientName: 'Client Name',
      clientNamePlaceholder: 'e.g. Alexander Noir',
      contactPhone: 'Contact Phone',
      selectArt: 'Select Art',
      preferredSchedule: 'Select Date',
      selectTimeSlot: 'Select Time Slot',
      requestAppointment: 'REQUEST APPOINTMENT',
      reservationSent: 'RESERVATION SENT',
      conciergeDashboard: 'Concierge Dashboard',
      managingClientele: 'Managing your premium clientele',
      systemAudible: 'SYSTEM AUDIBLE',
      activateVoice: 'ACTIVATE VOICE',
      liveOpsActive: 'LIVE OPS ACTIVE',
      timeNotSet: 'Time not set',
      services: ['Haircut & Styling', 'Signature Beard Trim', 'Royal Hot Towel Shave', 'The Noir Experience'],
      adminAccessTitle: 'Admin Access',
      approved: 'APPROVED',
      pending: 'PENDING',
      rejected: 'REJECTED',
      approve: 'Approve',
      reject: 'Reject',
      invalidTime: 'Appointments must be in 30-minute increments (e.g., 12:00, 12:30).',
      slotBooked: 'This slot is already booked.',
      selectDateFirst: 'Please select a date first.'
    }
  };

  const t = translations[lang];
  
  // Refs to fix closure issues in socket listener and persist AudioContext
  const audioEnabledRef = useRef(audioEnabled);
  const viewRef = useRef(view);
  const audioCtxRef = useRef(null);

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { viewRef.current = view; }, [view]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };
  
  // Web Audio API Synthesizer (100% reliable, no external file needed)
  const playNotificationSound = () => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio synth error:", e);
    }
  };

  useEffect(() => {
    socket.on('new_appointment', (appointment) => {
      setAppointments(prev => [appointment, ...prev]);
      if (viewRef.current === 'admin' && audioEnabledRef.current) {
        playNotificationSound();
        console.log("Synthesized notification sound played.");
      }
    });

    socket.on('appointment_updated', ({ id, status }) => {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    });

    fetch(`${SERVER_URL}/api/appointments`)
      .then(res => res.json())
      .then(data => setAppointments(data.reverse()));

    return () => {
      socket.off('new_appointment');
      socket.off('appointment_updated');
    };
  }, []); // Run once to keep socket listener alive with refs

  const generateSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const isSlotTaken = (timeSlot) => {
    return appointments.some(app => {
      if (app.status === 'rejected') return false;
      const appDateStr = new Date(app.time).toISOString();
      const targetDateStr = new Date(`${selectedDate}T${timeSlot}`).toISOString();
      return appDateStr === targetDateStr;
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert(lang === 'tr' ? 'Lütfen bir saat seçin.' : 'Please select a time slot.');
      return;
    }

    const fullTime = `${selectedDate}T${selectedSlot}`;
    const payload = { ...newAppointment, time: fullTime };

    const res = await fetch(`${SERVER_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsBooked(true);
      setNewAppointment(prev => ({ ...prev, name: '', phone: '' }));
      setSelectedSlot('');
      setTimeout(() => setIsBooked(false), 3000);
    } else {
      const data = await res.json();
      alert(data.error || "Booking failed");
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`${SERVER_URL}/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    // Note: Local state will be updated by the 'appointment_updated' socket listener
  };

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    if (nextState) {
      playNotificationSound(); // Play once to "wake up" the AudioContext
      console.log("Audio system armed with Synthesizer.");
    }
  };

  return (
    <div className="min-h-screen premium-bg text-white">
      {/* Navbar */}
      <nav className="p-8 flex justify-between items-center glass-panel m-6 sticky top-4 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-gradient-to-br from-[#ae8625] to-[#f7ef8a] rounded-lg shadow-lg">
            <Scissors className="text-black" size={24} />
          </div>
          <h1 className="text-2xl font-bold brand-title gold-text">Noir Barber</h1>
        </motion.div>
        
        <div className="flex gap-6 items-center">
          <button 
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs hover:border-[#d4af37] transition-all"
          >
            {lang.toUpperCase()}
          </button>
          {[
            { id: 'customer', label: t.bookStylist, icon: <Calendar size={18} /> },
            { id: 'admin', label: t.adminAccess, icon: <User size={18} /> }
          ].map((btn) => (
            <motion.button 
              key={btn.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView(btn.id)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all border ${
                view === btn.id 
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#ae8625] text-black border-transparent shadow-lg font-bold' 
                  : 'bg-white/5 border-white/10 hover:border-[#d4af37]/50 text-dim'
              }`}
            >
              {btn.icon}
              {btn.label}
            </motion.button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto p-4 flex justify-center">
        {view === 'customer' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-xl p-10 glass-panel relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Scissors size={120} className="text-[#d4af37]" />
            </div>

            <h2 className="text-4xl font-bold mb-8 gold-text brand-title">{t.secureSlot}</h2>
            <p className="text-dim mb-8 -mt-4">{t.experienceArt}</p>
            
            <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-widest text-[#ae8625] mb-2 block font-bold">{t.clientName}</label>
                <input 
                  required
                  type="text" 
                  value={newAppointment.name}
                  onChange={e => setNewAppointment({...newAppointment, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-[#d4af37] transition-all"
                  placeholder={t.clientNamePlaceholder}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[#ae8625] mb-2 block font-bold">{t.contactPhone}</label>
                <input 
                  required
                  type="tel" 
                  value={newAppointment.phone}
                  onChange={e => setNewAppointment({...newAppointment, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-[#d4af37] transition-all"
                  placeholder="+90 ..."
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[#ae8625] mb-2 block font-bold">{t.selectArt}</label>
                <select 
                  value={newAppointment.service}
                  onChange={e => setNewAppointment({...newAppointment, service: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-white/10 p-4 rounded-xl focus:outline-none focus:border-[#d4af37] text-white transition-all appearance-none"
                >
                  {t.services.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-widest text-[#ae8625] mb-2 block font-bold">{t.preferredSchedule}</label>
                <input 
                  required
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-[#d4af37] transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs uppercase tracking-widest text-[#ae8625] mb-4 block font-bold">{t.selectTimeSlot}</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {generateSlots().map(slot => {
                    const taken = isSlotTaken(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={taken}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 text-xs rounded-lg border transition-all ${
                          selectedSlot === slot 
                            ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                            : taken 
                              ? 'bg-white/5 border-transparent text-gray-700 cursor-not-allowed line-through opacity-50'
                              : 'bg-white/5 border-white/10 hover:border-[#d4af37] text-dim'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="btn-premium col-span-2 mt-4 flex items-center justify-center gap-3"
              >
                {isBooked ? <Check size={22} /> : <Calendar size={22} />}
                {isBooked ? t.reservationSent : t.requestAppointment}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h2 className="text-4xl font-bold gold-text brand-title flex items-center gap-4">
                  <Bell className="text-[#d4af37] animate-pulse" size={32} />
                  {t.conciergeDashboard}
                </h2>
                <p className="text-dim mt-2 tracking-widest uppercase text-xs">{t.managingClientele}</p>
              </div>
              <div className="flex items-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleAudio}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all ${
                    audioEnabled 
                      ? 'bg-[#00f260]/10 border-[#00f260]/40 text-[#00f260] shadow-[0_0_15px_rgba(0,242,96,0.1)]' 
                      : 'bg-[#ff4b2b]/10 border-[#ff4b2b]/40 text-[#ff4b2b]'
                  }`}
                >
                  <Bell size={18} />
                  {audioEnabled ? t.systemAudible : t.activateVoice}
                </motion.button>
                <div className="flex items-center gap-2 text-xs font-bold tracking-tighter text-[#d4af37] bg-white/5 px-5 py-3 rounded-xl border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#00f260] animate-ping" />
                  {t.liveOpsActive}
                </div>
              </div>
            </div>

            <div className="grid gap-8">
              <AnimatePresence>
                {appointments.map((app) => (
                  <motion.div 
                    key={app.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`glass-panel p-6 flex items-center justify-between border-l-4 ${
                      app.status === 'pending' ? 'border-[#ff4b2b] pending-alert' : 
                      app.status === 'approved' ? 'border-[#00f260]' : 'border-gray-600'
                    }`}
                  >
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <User className="text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{app.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Phone size={14} /> {app.phone}</span>
                          <span className="flex items-center gap-1"><Scissors size={14} /> {app.service}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> 
                            {app.time && !isNaN(new Date(app.time).getTime()) 
                              ? new Date(app.time).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') 
                              : t.timeNotSet}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updateStatus(app.id, 'approved')}
                            className="bg-[#00f260]/10 hover:bg-[#00f260]/20 text-[#00f260] p-3 rounded-lg border border-[#00f260]/20 transition-all"
                            title={t.approve}
                          >
                            <Check size={24} />
                          </button>
                          <button 
                              onClick={() => updateStatus(app.id, 'rejected')}
                            className="bg-[#ff4b2b]/10 hover:bg-[#ff4b2b]/20 text-[#ff4b2b] p-3 rounded-lg border border-[#ff4b2b]/20 transition-all"
                            title={t.reject}
                          >
                            <X size={24} />
                          </button>
                        </>
                      )}
                      {app.status !== 'pending' && (
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${
                          app.status === 'approved' ? 'bg-[#00f260]/20 text-[#00f260]' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {app.status === 'pending' ? t.pending : app.status === 'approved' ? t.approved : t.rejected}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {appointments.length === 0 && (
                <div className="text-center py-20 text-gray-500 glass-panel">
                  No appointments found yet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default App;
