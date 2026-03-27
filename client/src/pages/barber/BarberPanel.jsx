import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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

/* ── Calendar View ── */
function ScheduleCalendar({ appointments, selectedDate, onSelectDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const DAYS = ['Pa','Pt','Sa','Ça','Pe','Cu','Ct'];
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (d) => {
    if (!d) return null;
    const m = String(cursor.month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${cursor.year}-${m}-${dd}`;
  };

  const hasAppointments = (d) => {
    const dateStr = getDateStr(d);
    if (!dateStr) return false;
    return appointments.some(a => {
      const aDate = new Date(a.time).toISOString().split('T')[0];
      return aDate === dateStr && a.status === 'approved';
    });
  };

  const isSel = (d) => {
    const dateStr = getDateStr(d);
    return dateStr === selectedDate;
  };

  const isToday = (d) => {
    if (!d) return false;
    const date = new Date(cursor.year, cursor.month, d);
    return date.toDateString() === today.toDateString();
  };

  const prev = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Önceki ay">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        </button>
        <span className="font-bold text-on-surface">{MONTHS[cursor.month]} {cursor.year}</span>
        <button onClick={next} className="p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Sonraki ay">
          <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <span key={d} className="text-center text-[10px] font-bold text-on-surface-variant uppercase py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((d, i) => (
          <div
            key={i}
            onClick={() => d && onSelectDate(getDateStr(d))}
            className={`cal-day ${!d ? 'invisible' : ''} ${isSel(d) ? 'active' : ''} ${isToday(d) ? 'ring-2 ring-primary/30' : ''} relative cursor-pointer`}
          >
            {d}
            {hasAppointments(d) && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Clock/Timeline View ── */
function DayTimeline({ appointments, selectedDate }) {
  const dayAppts = appointments.filter(a => {
    const aDate = new Date(a.time).toISOString().split('T')[0];
    return aDate === selectedDate && a.status === 'approved';
  }).sort((a, b) => new Date(a.time) - new Date(b.time));

  const now = new Date();
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 - 19:00

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow">
      <h3 className="text-lg font-extrabold text-on-surface mb-4">
        <span className="material-symbols-outlined text-base mr-2">schedule</span>
        {new Date(selectedDate + 'T12:00').toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' })}
      </h3>
      <div className="space-y-1">
        {hours.map(h => {
          const hourAppts = dayAppts.filter(a => new Date(a.time).getHours() === h);
          const isNow = selectedDate === now.toISOString().split('T')[0] && now.getHours() === h;
          return (
            <div key={h} className={`flex items-start gap-3 py-2 ${isNow ? 'bg-primary/5 -mx-2 px-2 rounded-lg' : ''}`}>
              <span className={`text-xs font-bold w-12 text-right pt-1 ${isNow ? 'text-primary' : 'text-on-surface-variant'}`}>
                {String(h).padStart(2, '0')}:00
              </span>
              <div className="flex-1 border-l-2 border-surface-container pl-3">
                {hourAppts.length === 0 ? (
                  <div className="py-1">
                    <span className="text-xs text-on-surface-variant/40">Boş</span>
                  </div>
                ) : (
                  hourAppts.map(a => (
                    <div key={a.id} className="bg-primary/10 rounded-xl px-3 py-2 mb-1">
                      <p className="text-sm font-bold text-on-surface">{a.name}</p>
                      <p className="text-xs text-on-surface-variant">{a.service} · {new Date(a.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      {dayAppts.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-6">Bu gün için randevu yok</p>
      )}
    </div>
  );
}

/* ── Audio Upload & Selection Modal ── */
function SoundManager({ onClose, onSelect, currentSound }) {
  const [sounds, setSounds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const token = localStorage.getItem('noir_token');

  const loadSounds = () => {
    fetch(`${SERVER_URL}/api/sounds`)
      .then(r => r.json())
      .then(d => setSounds(d.files || []))
      .catch(() => {});
  };

  useEffect(loadSounds, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['mp3', 'wav'].includes(ext)) {
      setError('Sadece MP3 ve WAV dosyaları yüklenebilir.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('sound', file);
      const res = await fetch(`${SERVER_URL}/api/sounds/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      loadSounds();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`${filename} silinsin mi?`)) return;
    try {
      await fetch(`${SERVER_URL}/api/sounds/${filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadSounds();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg ambient-shadow max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-extrabold text-on-surface mb-6">Bildirim Sesi Yönet</h3>

        {error && <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        {/* Upload */}
        <div className="mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-outline-variant rounded-2xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-1 block">upload_file</span>
            <p className="text-sm text-on-surface-variant font-medium">
              {uploading ? 'Yükleniyor...' : 'MP3 veya WAV dosyası yüklemek için tıklayın'}
            </p>
          </button>
          <input ref={fileRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleUpload} className="hidden" />
        </div>

        {/* Sound list */}
        <div className="space-y-2 mb-6">
          {sounds.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-4">Henüz ses dosyası yüklenmemiş</p>
          ) : (
            sounds.map(f => (
              <div key={f} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${currentSound === f ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-low hover:bg-surface-container'}`}>
                <button
                  onClick={() => onSelect(f)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="material-symbols-outlined text-primary">{currentSound === f ? 'check_circle' : 'music_note'}</span>
                  <span className="text-sm font-semibold text-on-surface">{f}</span>
                </button>
                <button onClick={() => handleDelete(f)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full btn-primary py-3">Kapat</button>
      </div>
    </div>
  );
}

export default function BarberPanel({ token, currentUser, authHeaders, onLogout, audioEnabled, toggleAudio, playSynth }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [prevPending, setPrevPending] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('list'); // 'list', 'calendar', 'timeline'
  const [soundModalOpen, setSoundModalOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState(() => localStorage.getItem('noir_selected_sound') || '');
  const audioRef = useRef(null);

  // Load selected sound from settings
  useEffect(() => {
    fetch(`${SERVER_URL}/api/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.notificationSound) setSelectedSound(d.notificationSound);
      })
      .catch(() => {});
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!audioEnabled) return;
    if (selectedSound) {
      // Play selected custom sound
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const audio = new Audio(`${SERVER_URL}/sounds/${selectedSound}`);
        audioRef.current = audio;
        audio.play().catch(() => {
          // Fallback to synth
          playSynth();
        });
      } catch {
        playSynth();
      }
    } else {
      playSynth();
    }
  }, [audioEnabled, selectedSound, playSynth]);

  const fetchAppts = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const newPending = list.filter(a => a.status === 'pending').length;
      if (newPending > prevPending && prevPending !== 0 && audioEnabled) {
        playNotificationSound();
      }
      setPrevPending(newPending);
      setAppointments(list);
      setLoading(false);
    } catch { setLoading(false); }
  }, [token, audioEnabled, playNotificationSound]);

  /* Poll every 15 seconds */
  useEffect(() => {
    fetchAppts();
    const id = setInterval(fetchAppts, 15000);
    return () => clearInterval(id);
  }, [fetchAppts]);

  const updateStatus = async (id, status) => {
    setActionId(id);
    try {
      await fetch(`${SERVER_URL}/api/appointments/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      await fetchAppts();
    } finally { setActionId(null); }
  };

  const handleSoundSelect = async (filename) => {
    setSelectedSound(filename);
    localStorage.setItem('noir_selected_sound', filename);

    // Persist to server settings
    try {
      const settingsRes = await fetch(`${SERVER_URL}/api/settings`);
      const settings = await settingsRes.json();
      settings.notificationSound = filename;
      await fetch(`${SERVER_URL}/api/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ notificationSound: filename }),
      });
    } catch {}
  };

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' });
  const pending = appointments.filter(a => a.status === 'pending');
  const upcoming = appointments.filter(a => a.status === 'approved' && new Date(a.time) >= new Date());
  const past = appointments.filter(a => a.status === 'approved' && new Date(a.time) < new Date());

  function AppointmentCard({ appt, showActions }) {
    const timeStr = new Date(appt.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(appt.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
            <button
              disabled={actionId === appt.id}
              onClick={() => updateStatus(appt.id, 'approved')}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">check</span> Onayla
            </button>
            <button
              disabled={actionId === appt.id}
              onClick={() => updateStatus(appt.id, 'rejected')}
              className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">close</span> Reddet
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body">
      {/* Sound Manager Modal */}
      {soundModalOpen && (
        <SoundManager
          onClose={() => setSoundModalOpen(false)}
          onSelect={handleSoundSelect}
          currentSound={selectedSound}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container px-6 py-4 flex items-center justify-between">
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
          {/* View toggle */}
          <button
            onClick={() => setView('list')}
            className={`p-2.5 rounded-full transition-colors ${view === 'list' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            title="Liste Görünümü"
          >
            <span className="material-symbols-outlined text-base">list</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`p-2.5 rounded-full transition-colors ${view === 'calendar' || view === 'timeline' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            title="Takvim Görünümü"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
          </button>
          {/* Sound settings */}
          <button
            onClick={() => setSoundModalOpen(true)}
            className="p-2.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-blue-50 hover:text-primary transition-colors"
            title="Bildirim sesi ayarla"
          >
            <span className="material-symbols-outlined text-base">tune</span>
          </button>
          <button
            onClick={toggleAudio}
            className={`p-2.5 rounded-full transition-colors ${audioEnabled ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            title={audioEnabled ? 'Sound on' : 'Sound off'}
          >
            <span className="material-symbols-outlined text-base">{audioEnabled ? 'volume_up' : 'volume_off'}</span>
          </button>
          <button onClick={onLogout} className="p-2.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-red-50 hover:text-error transition-colors">
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{today}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Calendar/Timeline View */}
            {(view === 'calendar' || view === 'timeline') && (
              <div className="space-y-6">
                <ScheduleCalendar
                  appointments={appointments}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <DayTimeline appointments={appointments} selectedDate={selectedDate} />
              </div>
            )}

            {/* List View */}
            {view === 'list' && (
              <>
                {/* Pending */}
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

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="font-extrabold text-on-surface mb-3">Bugünkü Program</h2>
                    <div className="flex flex-col gap-3">
                      {upcoming.map(a => <AppointmentCard key={a.id} appt={a} showActions={false} />)}
                    </div>
                  </section>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <section>
                    <h2 className="font-extrabold text-on-surface mb-3 text-on-surface-variant">Geçmiş</h2>
                    <div className="flex flex-col gap-3">
                      {past.slice(0, 5).map(a => <AppointmentCard key={a.id} appt={a} showActions={false} />)}
                    </div>
                  </section>
                )}

                {appointments.length === 0 && (
                  <div className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">event_available</span>
                    <p className="font-semibold">Henüz randevu yok</p>
                    <p className="text-sm mt-1">Yeni rezervasyonlar burada görünecek</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
