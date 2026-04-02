import { useState, useEffect, useCallback, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

const STATUS_STYLE = {
  pending: 'status-pending',
  approved: 'status-confirmed',
  rejected: 'status-rejected',
};

const STATUS_TR = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS_FULL = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const DAY_SHORT = ['Pa','Pt','Sa','Ça','Pe','Cu','Ct'];

/* ── Horizontal Date Bar ── */
function DateBar({ cursor, onPrev, onNext, selectedDate, onSelectDate, appointments, slideDir }) {
  const baseDate = new Date(cursor.year, cursor.month, cursor.day);
  // Show 7 days: -3 before, selected (center), +3 after
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const dateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const hasPending = (d) => appointments.some(a => a.status === 'pending' && new Date(a.time).toISOString().split('T')[0] === dateStr(d));
  const hasApproved = (d) => appointments.some(a => a.status === 'approved' && new Date(a.time).toISOString().split('T')[0] === dateStr(d));

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-5 ambient-shadow">
      {/* Header with arrows */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Önceki gün">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        </button>
        <div className="text-center">
          <p className="text-sm font-extrabold text-on-surface">{MONTHS[cursor.month]} {cursor.year}</p>
          <p className="text-[10px] text-on-surface-variant">{DAYS_FULL[baseDate.getDay()]}, {cursor.day} {MONTHS[cursor.month]} {cursor.year}</p>
        </div>
        <button onClick={onNext} className="p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Sonraki gün">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
      </div>

      {/* 7-day strip with slide animation */}
      <div className="overflow-hidden">
        <div
          className="grid grid-cols-7 gap-1 transition-transform duration-300 ease-out"
          style={{
            transform: slideDir === 'left' ? 'translateX(-8px)' : slideDir === 'right' ? 'translateX(8px)' : 'translateX(0)',
            opacity: slideDir ? 0.6 : 1,
          }}
        >
          {days.map((d, i) => {
            const ds = dateStr(d);
            const isSel = ds === selectedDate;
            const isToday = ds === new Date().toISOString().split('T')[0];
            const dotColor = hasApproved(d) ? 'bg-red-400' : hasPending(d) ? 'bg-amber-400' : '';

            return (
              <button
                key={`${ds}-${i}`}
                onClick={() => onSelectDate(ds)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
                  isSel ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105' :
                  isToday ? 'bg-primary/10 text-primary ring-2 ring-primary/30' :
                  'hover:bg-surface-container text-on-surface'
                }`}
                aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}`}
                aria-current={isSel ? 'date' : undefined}
              >
                <span className={`text-[10px] font-bold uppercase ${isSel ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {DAY_SHORT[d.getDay()]}
                </span>
                <span className="text-lg font-extrabold">{d.getDate()}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isSel ? 'bg-on-primary' : dotColor || 'bg-green-400'
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] text-on-surface-variant">Boş</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] text-on-surface-variant">Bekliyor</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[10px] text-on-surface-variant">Onaylı</span>
        </div>
      </div>
    </div>
  );
}

/* ── Day Timeline — 30-min slots, multi-slot appointments ── */
function DayTimeline({ appointments, selectedDate }) {
  const dayAppts = appointments.filter(a => {
    const aDate = new Date(a.time).toISOString().split('T')[0];
    return aDate === selectedDate;
  }).sort((a, b) => new Date(a.time) - new Date(b.time));

  // Generate 30-min slots from 08:00 to 19:30
  const slots = [];
  for (let h = 8; h < 20; h++) {
    slots.push({ h, m: 0, label: `${String(h).padStart(2, '0')}:00` });
    slots.push({ h, m: 30, label: `${String(h).padStart(2, '0')}:30` });
  }

  // Find which slot an appointment starts in and how many slots it spans
  const getSlotInfo = (appt) => {
    const apptTime = new Date(appt.time);
    const startH = apptTime.getHours();
    const startM = apptTime.getMinutes();
    const startSlotIdx = slots.findIndex(s => s.h === startH && s.m === startM);

    // Get duration from service or default 30 min
    const duration = appt.duration || 30;
    const spanSlots = Math.ceil(duration / 30);

    return { startSlotIdx, spanSlots };
  };

  // Map slot index to appointment (if it starts there)
  const slotMap = {};
  // Track which slots are occupied (by spanning appointments)
  const occupiedSlots = new Set();

  dayAppts.forEach(appt => {
    const { startSlotIdx, spanSlots } = getSlotInfo(appt);
    if (startSlotIdx >= 0) {
      slotMap[startSlotIdx] = { appt, spanSlots };
      for (let i = 0; i < spanSlots; i++) {
        occupiedSlots.add(startSlotIdx + i);
      }
    }
  });

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow">
      <h3 className="text-lg font-extrabold text-on-surface mb-4">
        <span className="material-symbols-outlined text-base mr-2">today</span>
        {new Date(selectedDate + 'T12:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </h3>

      <div className="space-y-0.5">
        {slots.map((slot, idx) => {
          const info = slotMap[idx];
          const isOccupiedBySpan = occupiedSlots.has(idx) && !info;
          const isHalfHour = slot.m === 30;

          // Skip slots that are covered by a spanning appointment (not the start)
          if (isOccupiedBySpan) return null;

          return (
            <div key={idx} className={`flex items-stretch gap-3 py-1 ${isHalfHour ? 'opacity-70' : ''}`}>
              {/* Time label */}
              <span className={`text-[11px] w-12 text-right shrink-0 pt-2 ${isHalfHour ? 'text-on-surface-variant/60 font-medium' : 'font-bold text-on-surface-variant'}`}>
                {slot.label}
              </span>

              {/* Slot content */}
              <div className="flex-1 border-l-2 border-surface-container pl-3 flex flex-col gap-1">
                {info ? (
                  // Appointment — spans multiple 30-min slots
                  <div
                    className={`rounded-lg px-3 py-2 flex items-center gap-2 ${
                      info.appt.status === 'pending'
                        ? 'bg-amber-50 border border-amber-200'
                        : info.appt.status === 'approved'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                    style={{ minHeight: `${info.spanSlots * 36 - 4}px` }}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      info.appt.status === 'pending' ? 'bg-amber-400' :
                      info.appt.status === 'approved' ? 'bg-red-400' : 'bg-slate-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{info.appt.name}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {info.appt.service}
                        {info.spanSlots > 1 && ` (${info.spanSlots * 30}dk)`}
                        {' · '}
                        <span className={info.appt.status === 'pending' ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                          {STATUS_TR[info.appt.status]}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  // Empty — green available
                  <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-[11px] text-green-700 font-medium">Müsait</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {dayAppts.length === 0 && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <span className="material-symbols-outlined text-green-500 text-3xl block mb-1">event_available</span>
          <p className="text-sm font-bold text-green-700">Bu gün tamamen boş</p>
          <p className="text-xs text-green-600 mt-0.5">Randevu bulunmuyor</p>
        </div>
      )}
    </div>
  );
}

export default function BarberPanel({ token, currentUser, authHeaders, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() });
  const [view, setView] = useState('calendar');
  const [slideDir, setSlideDir] = useState('');

  // ── Sound state ──
  const [sounds, setSounds] = useState([]);
  const [selectedSound, setSelectedSound] = useState(() => localStorage.getItem('barber_selected_sound') || '');
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('barber_audio_enabled') === 'true');
  const audioRef = useRef(null);
  const audioEnabledRef = useRef(audioEnabled);
  const selectedSoundRef = useRef(selectedSound);
  const firstLoadRef = useRef(true);

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { selectedSoundRef.current = selectedSound; }, [selectedSound]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/sounds`)
      .then(r => r.json())
      .then(d => setSounds(d.files || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
  };

  const playSound = useCallback(() => {
    stopAudio();
    const sound = selectedSoundRef.current;
    if (sound) {
      const audio = new Audio(`${SERVER_URL}/sounds/${sound}`);
      audio.volume = 0.7;
      audioRef.current = audio;
      audio.play().catch(() => tryPlaySynth());
    } else {
      tryPlaySynth();
    }
  }, []);

  const tryPlaySynth = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 1.2);
    } catch {}
  };

  const toggleAudio = () => {
    stopAudio();
    const next = !audioEnabledRef.current;
    audioEnabledRef.current = next;
    setAudioEnabled(next);
    localStorage.setItem('barber_audio_enabled', String(next));
    if (next) playSound();
  };

  const handleSoundChange = (e) => {
    const filename = e.target.value;
    stopAudio();
    selectedSoundRef.current = filename;
    setSelectedSound(filename);
    localStorage.setItem('barber_selected_sound', filename);
    if (filename) {
      const audio = new Audio(`${SERVER_URL}/sounds/${filename}`);
      audio.volume = 0.7;
      audioRef.current = audio;
      audio.play().catch(() => {});
    }
  };

  // Date navigation with slide animation
  const navigateDay = (offset) => {
    setSlideDir(offset > 0 ? 'left' : 'right');
    setTimeout(() => {
      const d = new Date(cursor.year, cursor.month, cursor.day);
      d.setDate(d.getDate() + offset);
      setCursor({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
      setSelectedDate(d.toISOString().split('T')[0]);
      setSlideDir('');
    }, 150);
  };

  const handleSelectDate = (ds) => {
    const [y, m, d] = ds.split('-').map(Number);
    const oldDate = new Date(cursor.year, cursor.month, cursor.day);
    const newDate = new Date(y, m - 1, d);
    const diff = (newDate - oldDate) / (1000 * 60 * 60 * 24);

    if (diff !== 0) {
      setSlideDir(diff > 0 ? 'left' : 'right');
      setTimeout(() => {
        setCursor({ year: y, month: m - 1, day: d });
        setSelectedDate(ds);
        setSlideDir('');
      }, 150);
    }
  };

  // Fetch appointments
  const fetchAppts = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const pendingCount = list.filter(a => a.status === 'pending').length;
      if (!firstLoadRef.current && pendingCount > 0 && audioEnabledRef.current) playSound();
      firstLoadRef.current = false;
      setAppointments(list);
      setLoading(false);
    } catch { setLoading(false); }
  }, [authHeaders, playSound]);

  useEffect(() => {
    fetchAppts();
    const id = setInterval(fetchAppts, 15000);
    return () => clearInterval(id);
  }, [fetchAppts]);

  const updateStatus = async (id, status) => {
    setActionId(id);
    try {
      await fetch(`${SERVER_URL}/api/appointments/${id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
      });
      await fetchAppts();
    } finally { setActionId(null); }
  };

  const pending = appointments.filter(a => a.status === 'pending');
  const upcoming = appointments.filter(a => a.status === 'approved' && new Date(a.time) >= new Date());

  function AppointmentCard({ appt, showActions }) {
    const timeStr = new Date(appt.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = new Date(appt.time).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
    return (
      <div className="bg-surface-container-lowest rounded-[2rem] p-5 ambient-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-on-primary rounded-xl px-3 py-1.5 text-center shrink-0">
              <p className="text-lg font-extrabold leading-none">{timeStr}</p>
              <p className="text-[10px] text-on-primary/70">{dateStr}</p>
            </div>
            <div>
              <p className="font-extrabold text-on-surface">{appt.name}</p>
              <p className="text-xs text-on-surface-variant">{appt.phone}</p>
            </div>
          </div>
          <span className={STATUS_STYLE[appt.status]}>{STATUS_TR[appt.status] || appt.status}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
          <span className="material-symbols-outlined text-base">content_cut</span>
          <span>{appt.service}</span>
        </div>
        {showActions && appt.status === 'pending' && (
          <div className="flex gap-3">
            <button disabled={actionId === appt.id} onClick={() => updateStatus(appt.id, 'approved')} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 active:scale-95">
              <span className="material-symbols-outlined text-base">check</span> Onayla
            </button>
            <button disabled={actionId === appt.id} onClick={() => updateStatus(appt.id, 'rejected')} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 active:scale-95">
              <span className="material-symbols-outlined text-base">close</span> Reddet
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
            {(currentUser?.name || currentUser?.username || 'B')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-extrabold text-on-surface text-sm">{currentUser?.name || currentUser?.username}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Stilist Paneli</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sound selector (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <select value={selectedSound} onChange={handleSoundChange} className="input-base text-xs w-40 py-1.5" aria-label="Bildirim sesi seç">
              <option value="">Varsayılan (synth)</option>
              {sounds.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <button onClick={playSound} className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors" title="Sesi test et">
              <span className="material-symbols-outlined text-on-surface-variant text-base">play_arrow</span>
            </button>
          </div>
          <button onClick={toggleAudio} className={`p-2.5 rounded-full transition-colors ${audioEnabled ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`} aria-label={audioEnabled ? 'Sesi kapat' : 'Sesi aç'} title={audioEnabled ? 'Bildirim sesi açık' : 'Bildirim sesi kapalı'}>
            <span className="material-symbols-outlined text-base">{audioEnabled ? 'volume_up' : 'volume_off'}</span>
          </button>
          <button onClick={onLogout} className="p-2.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-red-50 hover:text-error transition-colors" aria-label="Çıkış yap">
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile sound selector */}
        <div className="md:hidden flex items-center gap-2 mb-4">
          <select value={selectedSound} onChange={handleSoundChange} className="input-base text-xs flex-1" aria-label="Bildirim sesi seç">
            <option value="">Varsayılan (synth)</option>
            {sounds.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <button onClick={playSound} className="p-2 rounded-lg bg-surface-container" title="Test et">
            <span className="material-symbols-outlined text-on-surface-variant text-base">play_arrow</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── DESKTOP: side by side ── */}
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              {/* Left: Date bar + day timeline */}
              <div className="space-y-6">
                <DateBar cursor={cursor} onPrev={() => navigateDay(-1)} onNext={() => navigateDay(1)} selectedDate={selectedDate} onSelectDate={handleSelectDate} appointments={appointments} slideDir={slideDir} />
                <DayTimeline appointments={appointments} selectedDate={selectedDate} />
              </div>

              {/* Right: pending + upcoming lists */}
              <div className="space-y-6">
                {pending.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="font-extrabold text-on-surface">Onay Bekleyen</h2>
                      <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{pending.length}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {pending.map(a => <AppointmentCard key={a.id} appt={a} showActions={true} />)}
                    </div>
                  </section>
                )}
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="font-extrabold text-on-surface mb-3">Bugünkü Program</h2>
                    <div className="flex flex-col gap-3">
                      {upcoming.map(a => <AppointmentCard key={a.id} appt={a} showActions={false} />)}
                    </div>
                  </section>
                )}
                {pending.length === 0 && upcoming.length === 0 && (
                  <div className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">event_available</span>
                    <p className="font-semibold">Henüz randevu yok</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── MOBILE: always show appointments first, then calendar ── */}
            <div className="md:hidden space-y-6">
              {pending.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-extrabold text-on-surface">Onay Bekleyen</h2>
                    <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{pending.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {pending.map(a => <AppointmentCard key={a.id} appt={a} showActions={true} />)}
                  </div>
                </section>
              )}
              {upcoming.length > 0 && (
                <section>
                  <h2 className="font-extrabold text-on-surface mb-3">Bugünkü Program</h2>
                  <div className="flex flex-col gap-3">
                    {upcoming.map(a => <AppointmentCard key={a.id} appt={a} showActions={false} />)}
                  </div>
                </section>
              )}
              <DateBar cursor={cursor} onPrev={() => navigateDay(-1)} onNext={() => navigateDay(1)} selectedDate={selectedDate} onSelectDate={handleSelectDate} appointments={appointments} slideDir={slideDir} />
              <DayTimeline appointments={appointments} selectedDate={selectedDate} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
