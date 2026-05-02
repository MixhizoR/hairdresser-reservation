import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const SERVER_URL = import.meta.env.VITE_API_URL || '';
const CAT_LABELS_TR = { BARBERING: 'Berberlik', GROOMING: 'Bakım', TREATMENTS: 'Tedavi' };

/* ── Month Calendar ── */
function MonthCalendar({ selectedDate, onSelect, fullyBookedDays = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate max date (14 days from today)
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);

  const [cursor, setCursor] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS = ['Pa','Pt','Sa','Ça','Pe','Cu','Ct'];
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSel = (d) => {
    if (!d || !selectedDate) return false;
    const sel = new Date(selectedDate);
    return sel.getFullYear() === cursor.year && sel.getMonth() === cursor.month && sel.getDate() === d;
  };
  const isPast = (d) => {
    if (!d) return true;
    return new Date(cursor.year, cursor.month, d) < today;
  };
  const isBeyondLimit = (d) => {
    if (!d) return true;
    const checkDate = new Date(cursor.year, cursor.month, d);
    return checkDate > maxDate;
  };
  const isFullyBooked = (d) => {
    if (!d) return false;
    const dateStr = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return fullyBookedDays.includes(dateStr);
  };

  const select = (d) => {
    if (!d || isPast(d) || isBeyondLimit(d) || isFullyBooked(d)) return;
    const y = cursor.year;
    const m = String(cursor.month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onSelect(`${y}-${m}-${dd}`);
  };

  const prev = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        </button>
        <span className="font-bold text-on-surface">{MONTHS[cursor.month]} {cursor.year}</span>
        <button onClick={next} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <span key={d} className="text-center text-[10px] font-bold text-on-surface-variant uppercase py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => (
          <div key={i} onClick={() => select(d)} className={`cal-day ${!d ? 'invisible' : ''} ${isSel(d) ? 'active' : ''} ${isPast(d) || isBeyondLimit(d) || isFullyBooked(d) ? 'disabled' : ''}`}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step badge ── */
function Step({ num, label, active, done }) {
  return (
    <div className={`flex items-center gap-3 transition-opacity ${active || done ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
        {done ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : num}
      </div>
      <span className={`text-sm font-semibold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
    </div>
  );
}

const LEVEL_STYLE = { JUNIOR: 'bg-slate-100 text-slate-600', SENIOR: 'bg-blue-50 text-blue-700', MASTER: 'bg-amber-50 text-amber-700', DIRECTOR: 'bg-purple-50 text-purple-700' };
const LEVEL_TR = { JUNIOR: 'Çırak', SENIOR: 'Uzman', MASTER: 'Usta', DIRECTOR: 'Direktör' };
const PLACEHOLDER_PHOTOS = [
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?auto=format&fit=crop&w=200&q=80',
];

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [takenSlots, setTakenSlots] = useState([]);
  const [fullyBookedDays, setFullyBookedDays] = useState([]);
  const [success, setSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState({ serviceId: '', barberId: '', date: '', time: '', name: '', phone: '', notes: '' });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const maskPhone = (val) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length === 0) return '';
    let masked = '0';
    if (clean.startsWith('0')) clean = clean.slice(1);
    const part1 = clean.slice(0, 3);
    const part2 = clean.slice(3, 6);
    const part3 = clean.slice(6, 8);
    const part4 = clean.slice(8, 10);
    if (part1) masked += ` (${part1}`;
    if (part1.length === 3) masked += ')';
    if (part2) masked += ` ${part2}`;
    if (part3) masked += ` ${part3}`;
    if (part4) masked += ` ${part4}`;
    return masked;
  };

  useEffect(() => {
    fetch(`${SERVER_URL}/api/services`).then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${SERVER_URL}/api/barbers`).then(r => r.json()).then(d => setBarbers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${SERVER_URL}/api/settings`).then(r => r.json()).then(d => setSettings(d)).catch(() => {});

    // Fetch fully booked days for current month
    const now = new Date();
    fetch(`${SERVER_URL}/api/appointments/availability?month=${now.getMonth()}&year=${now.getFullYear()}`)
      .then(r => r.json())
      .then(d => {
        if (d.fullyBookedDays) {
          setFullyBookedDays(d.fullyBookedDays);
        }
      })
      .catch(() => {});
  }, []);

  /* Fetch taken slots when barber+date changes */
  useEffect(() => {
    if (!form.barberId || !form.date) { setTakenSlots([]); return; }
    fetch(`${SERVER_URL}/api/appointments/availability?barberId=${form.barberId}&date=${form.date}`)
      .then(r => r.json())
      .then(d => {
        const appointments = d.appointments || d;
        if (Array.isArray(appointments)) {
          const filtered = appointments.filter(a => {
            const aDate = new Date(a.time).toISOString().split('T')[0];
            return aDate === form.date && ['pending','approved'].includes(a.status);
          });
          setTakenSlots(filtered);
        }
        if (d.fullyBookedDays) {
          setFullyBookedDays(d.fullyBookedDays);
        }
      })
      .catch(() => {});
  }, [form.barberId, form.date]);

  /* Block extra slots based on selected service duration */
  const selectedService = services.find(s => String(s.id) === form.serviceId);

  /* Extract all occupied time slots from takenSlots (accounting for duration) */
  const occupiedSlots = new Set();
  takenSlots.forEach(a => {
    const d = new Date(a.time);
    const startMinutes = d.getHours() * 60 + d.getMinutes();
    const duration = a.customDuration || a.serviceRef?.duration || 30;
    const slotsNeeded = Math.ceil(duration / 30);
    for (let i = 0; i < slotsNeeded; i++) {
      const total = startMinutes + i * 30;
      const hh = Math.floor(total / 60).toString().padStart(2, '0');
      const mm = (total % 60).toString().padStart(2, '0');
      occupiedSlots.add(`${hh}:${mm}`);
    }
  });

  /* Check if a slot is unavailable due to overlaps or exceeding closing time */
  const isSlotUnavailable = (slot) => {
    const slotsNeeded = selectedService?.duration ? Math.ceil(selectedService.duration / 30) : 1;
    const [sh, sm] = slot.split(':').map(Number);
    const startMinutes = sh * 60 + sm;

    // Check if any of the required slots overlap with occupied slots or exceed 21:00
    for (let i = 0; i < slotsNeeded; i++) {
      const total = startMinutes + i * 30;
      const hh = Math.floor(total / 60).toString().padStart(2, '0');
      const mm = (total % 60).toString().padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      // Check if this slot is occupied
      if (occupiedSlots.has(timeStr)) return true;

      // Check if this slot exceeds 21:00 (closing time)
      if (total >= 21 * 60) return true;
    }
    return false;
  };

  /* Generate time slots based on hardcoded working hours (08:00-21:00) */
  const times = [];
  if (form.date) {
    for (let h = 8; h < 21; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
      times.push(`${String(h).padStart(2, '0')}:30`);
    }
  }

  /* Disable past time slots for today */
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isPastTime = (slot) => {
    if (form.date !== todayStr) return false;
    const [sh, sm] = slot.split(':').map(Number);
    const slotMinutes = sh * 60 + sm;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  };

  const validatePhone = (val) => {
    const clean = val.replace(/\D/g, '');
    if (val === '') { setPhoneError(''); return; }
    if (clean.length !== 11) {
      setPhoneError('Telefon numarası 11 haneli olmalıdır.');
    } else if (!/^05\d{9}$/.test(clean)) {
      setPhoneError('Format: 05xxxxxxxxx (05 ile başlamalıdır)');
    } else {
      setPhoneError('');
    }
  };

  const submit = async () => {
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!/^05\d{9}$/.test(cleanPhone)) { setPhoneError('Format: 05xxxxxxxxx (11 haneli)'); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      /* Build the datetime string the backend expects */
      const dt = new Date(`${form.date}T${form.time}:00`);
      const body = {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        service: selectedService?.name || '',
        time: dt.toISOString(),
        barberId: form.barberId,
        notes: form.notes.trim() || undefined,
        website: '',
      };
      const res = await fetch(`${SERVER_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bir şeyler ters gitti');
      }
      setSuccess(data);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    const trackingCode = success.trackingCode || success.id?.slice(0, 8).toUpperCase();

    const handleCopy = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(trackingCode);
        } else {
          // Fallback for browsers that disallow clipboard access
          const ta = document.createElement('textarea');
          ta.value = trackingCode;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {
        // Graceful fallback - show manual copy prompt
        prompt('Kopyalamak için kodu seçin:', trackingCode);
      }
    };

    const handleTrack = () => {
      navigate(`/track?code=${encodeURIComponent(trackingCode)}`);
    };

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center font-body">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 ambient-shadow">
          <span className="material-symbols-outlined text-green-600 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-3xl font-extrabold text-on-surface mb-3">Randevu Talebi Gönderildi!</h2>
        <p className="text-on-surface-variant mb-2 max-w-sm">Randevunuz onay bekliyor. Takip kodunuzu aşağıda saklayın.</p>
        <div className="bg-surface-container-lowest rounded-[2rem] px-10 py-6 inline-block ambient-shadow my-6">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Takip Kodu</p>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-4xl font-extrabold tracking-widest text-primary">{trackingCode}</span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-full hover:bg-surface-container transition-colors"
              aria-label="Takip kodunu kopyala"
              title={copySuccess ? 'Kopyalandı!' : 'Kopyala'}
            >
              <span className={`material-symbols-outlined text-xl ${copySuccess ? 'text-green-600' : 'text-on-surface-variant'}`}>
                {copySuccess ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
          {copySuccess && <p className="text-xs text-green-600 mt-2 font-medium">Kopyalandı!</p>}
        </div>
        <p className="text-sm text-on-surface-variant mb-8">Randevu durumunuzu kontrol etmek için bu kodu <strong>/track</strong> sayfasında kullanın.</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={handleTrack} className="btn-primary">Randevuyu Takip Et</button>
          <a href="/" className="btn-secondary">Ana Sayfaya Dön</a>
        </div>
      </div>
    );
  }

  const selectedBarber = barbers.find(b => String(b.id) === form.barberId);
  const steps = ['Hizmet', 'Stilist', 'Tarih & Saat', 'Detaylar'];

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        {/* Page title */}
        <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-sm">lock_open</span>
            Giriş gerekmez
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-3">Randevunuzu Oluşturun</h1>
          <p className="text-on-surface-variant text-lg max-w-xl">Hizmetinizi, stilistinizi ve tercih ettiğiniz saati seçerek yolculuğunuza başlayın.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Left: Steps + Summary ── */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow">
                <div className="flex flex-col gap-4">
                  {steps.map((s, i) => <Step key={s} num={i + 1} label={s} active={step === i + 1} done={step > i + 1} />)}
                </div>
              </div>

              {/* Summary */}
              {(selectedService || selectedBarber || form.date || form.time) && (
                <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Seçiminiz</p>
                  <div className="flex flex-col gap-3 text-sm">
                    {selectedService && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-base">content_cut</span>
                          <span className="font-medium text-on-surface">{selectedService.name}</span>
                        </div>
                        <span className="text-primary font-bold">₺{selectedService.price}</span>
                      </div>
                    )}
                    {selectedBarber && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">face</span>
                        <span className="font-medium text-on-surface">{selectedBarber.name}</span>
                      </div>
                    )}
                    {form.date && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                        <span className="font-medium text-on-surface">{new Date(form.date + 'T12:00').toLocaleDateString('tr-TR', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {form.time && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">schedule</span>
                        <span className="font-medium text-on-surface">{form.time}</span>
                        {selectedService && <span className="text-on-surface-variant text-xs">({selectedService.duration} dk)</span>}
                      </div>
                    )}
                    {selectedService && (
                      <div className="mt-2 pt-3 border-t border-primary/10 flex justify-between">
                        <span className="font-bold text-on-surface">Tahmini Toplam</span>
                        <span className="font-extrabold text-primary text-lg">₺{selectedService.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Right: Step content ── */}
          <main className="lg:col-span-8">

            {/* STEP 1 — Service */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm">1</span>
                  Hizmet Seçin
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(services.length > 0 ? services : []).map(s => (
                    <button key={s.id} onClick={() => { update('serviceId', String(s.id)); setStep(2); }}
                      className={`group relative text-left rounded-[2rem] p-6 border-2 transition-all duration-200 ${form.serviceId === String(s.id) ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 ambient-shadow'}`}
                    >
                      <div className="absolute inset-0 bg-primary/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-extrabold text-on-surface">{s.name}</h3>
                          <span className="font-extrabold text-primary">₺{s.price}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">{s.description || 'Premium bakım deneyimi.'}</p>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>{s.duration} dk</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">category</span>{CAT_LABELS_TR[s.category] || s.category}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Barber */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm">2</span>
                  Stilistinizi Seçin
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {barbers.map((b, i) => (
                    <button key={b.id} onClick={() => { update('barberId', String(b.id)); setStep(3); }}
                      className={`group relative text-left rounded-[2rem] overflow-hidden border-2 transition-all duration-200 ${
                        form.barberId === String(b.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 ambient-shadow'
                      }`}
                    >
                      <img
                        src={b.photoUrl ? `${SERVER_URL}${b.photoUrl}` : PLACEHOLDER_PHOTOS[i % PLACEHOLDER_PHOTOS.length]}
                        alt={b.name}
                        className="w-full h-48 object-cover"
                        onError={e => { e.target.src = PLACEHOLDER_PHOTOS[i % PLACEHOLDER_PHOTOS.length]; }}
                      />
                      <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${LEVEL_STYLE[b.level] || LEVEL_STYLE.SENIOR}`}>{LEVEL_TR[b.level] || b.level || 'Uzman'}</span>
                      {form.barberId === String(b.id) && (
                        <span className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md px-4 py-3">
                        <p className="font-bold text-on-surface text-sm">{b.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mt-4 text-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">arrow_back</span> Geri
                </button>
              </div>
            )}

            {/* STEP 3 — Date & Time */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-extrabold text-on-surface flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm">3</span>
                  Tarih ve Saat Seçin
                </h2>
                <div className="bg-surface-container-low rounded-[2rem] p-6">
                  <MonthCalendar selectedDate={form.date} onSelect={(d) => update('date', d)} fullyBookedDays={fullyBookedDays} />
                </div>

                {form.date && (
                  <div className="bg-surface-container-low rounded-[2rem] p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Müsait Saatler</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {times.map(t => {
                        const pastTime = isPastTime(t);
                        const unavail = isSlotUnavailable(t) || pastTime;
                        const sel = form.time === t;
                        return (
                          <button key={t} disabled={unavail} onClick={() => !unavail && update('time', t)}
                            className={`time-slot ${unavail ? 'taken' : ''} ${sel ? 'selected' : ''}`}
                          >{t}</button>
                        );
                      })}
                    </div>
                    {selectedService && (
                      <p className="text-xs text-on-surface-variant mt-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        {selectedService.duration} dk seans — {Math.ceil(selectedService.duration / 30)} slot ayrılacak
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Geri</button>
                  <button disabled={!form.date || !form.time} onClick={() => setStep(4)} className="btn-primary flex-1 disabled:opacity-40">
                    Devam →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — Details */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-extrabold text-on-surface flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm">4</span>
                  Bilgileriniz
                </h2>

                {submitError && (
                  <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    {submitError}
                  </div>
                )}

                <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow flex flex-col gap-4">
                  {/* Honeypot — hidden from users */}
                  <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" readOnly />

                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Ad Soyad *</label>
                    <input className="input-base" placeholder="Ahmet Yılmaz" value={form.name} onChange={e => update('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Telefon Numarası *</label>
                    <input
                      className="input-base"
                      placeholder="0 (5__) ___ __ __"
                      value={form.phone}
                      onChange={e => {
                        const masked = maskPhone(e.target.value);
                        update('phone', masked);
                        validatePhone(masked);
                      }}
                    />
                    {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Notlar (isteğe bağlı)</label>
                    <textarea className="input-base resize-none h-24" placeholder="Özel istekleriniz..." value={form.notes} onChange={e => update('notes', e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Geri</button>
                  <button
                    disabled={!form.name.trim() || !form.phone.trim() || !!phoneError || submitting}
                    onClick={submit}
                    className="btn-primary flex-1 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      : <><span className="material-symbols-outlined text-base">check_circle</span> Randevuyu Onayla</>
                    }
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
