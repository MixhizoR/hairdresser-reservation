import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const API = '/api';
const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

/* ─── Calendar ─── */
function MonthCalendar({ selectedDate, onSelect, minDate }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(cursor.year, cursor.month, 1);
  const lastDay  = new Date(cursor.year, cursor.month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const isSame = (d) => {
    if (!selectedDate || !d) return false;
    const sel = new Date(selectedDate);
    return sel.getFullYear() === cursor.year && sel.getMonth() === cursor.month && sel.getDate() === d;
  };

  const isPast = (d) => {
    if (!d) return true;
    const date = new Date(cursor.year, cursor.month, d);
    const min = minDate ? new Date(minDate) : today;
    min.setHours(0, 0, 0, 0);
    return date < min;
  };

  const select = (d) => {
    if (!d || isPast(d)) return;
    const date = new Date(cursor.year, cursor.month, d);
    onSelect(date.toISOString().split('T')[0]);
  };

  const prevMonth = () => {
    setCursor(c => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: c.month - 1 };
    });
  };
  const nextMonth = () => {
    setCursor(c => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: c.month + 1 };
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        </button>
        <span className="font-bold text-on-surface">{MONTHS[cursor.month]} {cursor.year}</span>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <span key={d} className="text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wide py-1">{d}</span>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d, i) => (
          <div
            key={i}
            onClick={() => select(d)}
            className={`cal-day ${!d ? 'invisible' : ''} ${isSame(d) ? 'active' : ''} ${isPast(d) ? 'disabled' : ''}`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TimeGrid ─── */
function TimeGrid({ slots, selectedTime, onSelect }) {
  const times = [];
  for (let h = 9; h <= 17; h++) {
    times.push(`${String(h).padStart(2,'0')}:00`);
    if (h < 17) times.push(`${String(h).padStart(2,'0')}:30`);
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {times.map(t => {
        const taken = slots.includes(t);
        const selected = selectedTime === t;
        return (
          <button
            key={t}
            onClick={() => !taken && onSelect(t)}
            className={`time-slot text-sm ${taken ? 'taken' : ''} ${selected ? 'selected' : ''}`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/* ─── StepBadge ─── */
function Step({ num, label, active, done }) {
  return (
    <div className={`flex items-center gap-3 ${active || done ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors ${
        done ? 'bg-green-500 text-white' : active ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
      }`}>
        {done ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : num}
      </div>
      <span className={`text-sm font-semibold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label}</span>
    </div>
  );
}

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers]   = useState([]);
  const [takenSlots, setTakenSlots] = useState([]);
  const [success, setSuccess]   = useState(null);

  const [form, setForm] = useState({
    serviceId: '',
    barberId:  '',
    date:      '',
    time:      '',
    name:      '',
    phone:     '',
    notes:     '',
  });

  useEffect(() => {
    fetch(`${API}/services`).then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(()=>{});
    fetch(`${API}/barbers`).then(r => r.json()).then(d => setBarbers(Array.isArray(d) ? d : [])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!form.date || !form.barberId) return;
    fetch(`${API}/appointments/availability?barberId=${form.barberId}&date=${form.date}`)
      .then(r => r.json())
      .then(d => setTakenSlots(Array.isArray(d) ? d : []))
      .catch(() => setTakenSlots([]));
  }, [form.date, form.barberId]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = async () => {
    try {
      const [hh, mm] = form.time.split(':');
      const dt = new Date(form.date);
      dt.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);

      const body = {
        clientName: form.name,
        clientPhone: form.phone,
        serviceId: parseInt(form.serviceId),
        barberId:  parseInt(form.barberId),
        appointmentTime: dt.toISOString(),
        notes: form.notes,
      };

      const res = await fetch(`${API}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSuccess(data);
    } catch (err) {
      alert(err.message);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-green-600 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="text-3xl font-extrabold text-on-surface mb-3">Booking Confirmed!</h2>
        <p className="text-on-surface-variant mb-2">Your appointment ID is:</p>
        <div className="bg-surface-container-lowest rounded-2xl px-8 py-4 inline-block ambient-shadow mb-6">
          <span className="text-4xl font-extrabold tracking-widest text-primary">{success.id || success.appointmentId}</span>
        </div>
        <p className="text-sm text-on-surface-variant mb-8">Save this ID to track your appointment status.</p>
        <div className="flex gap-4">
          <a href="/track" className="btn-primary">Track Appointment</a>
          <a href="/" className="btn-secondary">Back to Home</a>
        </div>
      </div>
    );
  }

  const steps = ['Service', 'Stylist', 'Date & Time', 'Details'];
  const service = services.find(s => s.id === parseInt(form.serviceId));
  const barber  = barbers.find(b => b.id === parseInt(form.barberId));

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28">
              {/* Progress */}
              <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow mb-6">
                <h1 className="text-2xl font-extrabold text-on-surface mb-1">Book Your Session</h1>
                <p className="text-sm text-on-surface-variant mb-8">A premium experience, just a few taps away.</p>

                <div className="flex flex-col gap-4">
                  {steps.map((s, i) => (
                    <Step key={s} num={i + 1} label={s} active={step === i + 1} done={step > i + 1} />
                  ))}
                </div>
              </div>

              {/* Summary */}
              {(service || barber || form.date || form.time) && (
                <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Your Selection</p>
                  <div className="flex flex-col gap-3">
                    {service && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-base">content_cut</span>
                        <span className="text-on-surface font-medium">{service.name}</span>
                        <span className="ml-auto text-on-surface-variant">₺{service.price}</span>
                      </div>
                    )}
                    {barber && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-base">face</span>
                        <span className="text-on-surface font-medium">{barber.name}</span>
                      </div>
                    )}
                    {form.date && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                        <span className="text-on-surface font-medium">{new Date(form.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</span>
                      </div>
                    )}
                    {form.time && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-base">schedule</span>
                        <span className="text-on-surface font-medium">{form.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── RIGHT MAIN ── */}
          <main className="lg:col-span-2">

            {/* STEP 1 — Service */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface mb-6">Choose a Service</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(services.length > 0 ? services : [
                    { id: 1, name: 'Classic Cut', price: 250, duration: 45, category: 'BARBERING' },
                    { id: 2, name: 'Beard Sculpt', price: 150, duration: 30, category: 'GROOMING' },
                    { id: 3, name: 'Full Package', price: 550, duration: 90, category: 'TREATMENTS' },
                  ]).map(s => (
                    <button
                      key={s.id}
                      onClick={() => { update('serviceId', String(s.id)); setStep(2); }}
                      className={`text-left rounded-[2rem] p-6 border-2 transition-all duration-200 ${
                        form.serviceId === String(s.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/30 ambient-shadow'
                      }`}
                    >
                      <p className="font-extrabold text-on-surface mb-1">{s.name}</p>
                      <p className="text-xs text-on-surface-variant mb-4">{s.duration} min · {s.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-extrabold text-primary">₺{s.price}</span>
                        <span className="material-symbols-outlined text-primary">arrow_forward</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2 — Barber */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-extrabold text-on-surface mb-6">Choose Your Stylist</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(barbers.length > 0 ? barbers : [
                    { id: 1, name: 'Alex Morgan', level: 'MASTER', speciality: 'Fade Specialist' },
                    { id: 2, name: 'James Rivera', level: 'DIRECTOR' },
                  ]).map((b, i) => (
                    <button
                      key={b.id}
                      onClick={() => { update('barberId', String(b.id)); setStep(3); }}
                      className={`text-left rounded-[2rem] p-6 border-2 transition-all duration-200 ${
                        form.barberId === String(b.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/30 ambient-shadow'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-xl font-extrabold text-primary shrink-0">
                          {b.name[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-on-surface">{b.name}</p>
                          <p className="text-xs text-on-surface-variant">{b.speciality || b.level}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 mt-1 inline-block">
                            {b.level}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mt-4 text-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">arrow_back</span> Back
                </button>
              </div>
            )}

            {/* STEP 3 — Date & Time */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-extrabold text-on-surface">Pick a Date</h2>
                <MonthCalendar
                  selectedDate={form.date}
                  onSelect={(d) => update('date', d)}
                  minDate={new Date().toISOString().split('T')[0]}
                />
                {form.date && (
                  <div>
                    <h3 className="font-bold text-on-surface mb-3">Available Times</h3>
                    <TimeGrid slots={takenSlots} selectedTime={form.time} onSelect={(t) => update('time', t)} />
                  </div>
                )}
                <div className="flex gap-4 mt-2">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                  <button
                    disabled={!form.date || !form.time}
                    onClick={() => setStep(4)}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — Details */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-extrabold text-on-surface">Your Details</h2>
                <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Full Name *</label>
                    <input
                      className="input-base"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Phone Number *</label>
                    <input
                      className="input-base"
                      placeholder="+90 555 123 4567"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Notes (optional)</label>
                    <textarea
                      className="input-base resize-none h-24"
                      placeholder="Any special requests..."
                      value={form.notes}
                      onChange={e => update('notes', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
                  <button
                    disabled={!form.name.trim() || !form.phone.trim()}
                    onClick={submit}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    Confirm Booking ✓
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
