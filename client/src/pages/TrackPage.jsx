import { useState } from 'react';
import Navbar from '../components/Navbar';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-500',  icon: 'schedule',      desc: 'Awaiting confirmation from your stylist.' },
  approved:  { label: 'Confirmed', color: 'bg-primary',    icon: 'check_circle',  desc: 'Your appointment is confirmed. See you soon!' },
  completed: { label: 'Completed', color: 'bg-green-500',  icon: 'done_all',      desc: 'Service completed. Thank you for visiting!' },
  rejected:  { label: 'Rejected',  color: 'bg-error',      icon: 'cancel',        desc: 'Unfortunately your appointment was rejected.' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-400',  icon: 'event_busy',    desc: 'This appointment has been cancelled.' },
};

const TIMELINE = ['pending', 'approved', 'completed'];

export default function TrackPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    const q = query.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      /* Backend endpoint: GET /api/appointments/track?code=XXXXXX */
      const res = await fetch(`${SERVER_URL}/api/appointments/track?code=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Appointment not found');
      /* Backend returns array — take first result */
      const appt = Array.isArray(data) ? data[0] : data;
      if (!appt) throw new Error('No appointment found for this code');
      setResult(appt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

  const statusKey = result?.status?.toLowerCase() || 'pending';
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const currentStep = TIMELINE.indexOf(statusKey);

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* ── Left: Info ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Appointment Tracker
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface leading-tight mb-3">
                Track Your<br />Appointment
              </h1>
              <p className="text-on-surface-variant">Enter the tracking code you received after booking to check your appointment status.</p>
            </div>

            {result && (
              <>
                {/* ID card */}
                <div className="inline-flex items-center gap-3 bg-surface-container rounded-full px-6 py-4 self-start">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tracking Code</p>
                    <p className="font-extrabold text-on-surface text-xl">{result.trackingCode}</p>
                  </div>
                </div>

                {/* Barber */}
                <div className="flex items-center gap-4 bg-surface-container rounded-full px-4 py-3 self-start">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary text-sm">
                    {(result.barberName || result.barber?.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your Stylist</p>
                    <p className="font-bold text-on-surface text-sm">{result.barberName || result.barber?.name || 'Stylist'}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-surface-container-highest rounded-[2rem] px-8 py-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Service</span>
                    <span className="font-bold text-on-surface">{result.service}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Date</span>
                    <span className="font-bold text-on-surface">{fmt(result.time)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Time</span>
                    <span className="font-bold text-on-surface">{fmtTime(result.time)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Name</span>
                    <span className="font-bold text-on-surface">{result.name}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Right: Search + Status ── */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Search card */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
              <h2 className="text-xl font-extrabold text-on-surface mb-2">Find Your Appointment</h2>
              <p className="text-sm text-on-surface-variant mb-6">Enter the tracking code (e.g. AB3X9Z) you received after booking.</p>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="e.g. AB3X9Z"
                    className="input-base pl-12 font-mono tracking-widest uppercase"
                  />
                </div>
                <button onClick={search} disabled={loading || !query.trim()} className="btn-primary px-6 shrink-0 flex items-center gap-2 disabled:opacity-40">
                  {loading ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : 'Search'}
                </button>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}
            </div>

            {/* Status result */}
            {result && (
              <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
                {/* Status badge */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 rounded-full ${cfg.color} flex items-center justify-center shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-on-surface text-xl">{cfg.label}</p>
                    <p className="text-sm text-on-surface-variant">{cfg.desc}</p>
                  </div>
                </div>

                {/* Timeline */}
                {statusKey !== 'rejected' && statusKey !== 'cancelled' && (
                  <div className="flex flex-col gap-0">
                    {TIMELINE.map((s, idx) => {
                      const c = STATUS_CONFIG[s];
                      const isDone = idx <= currentStep;
                      const isCur = idx === currentStep;
                      const isLast = idx === TIMELINE.length - 1;
                      return (
                        <div key={s} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 ${isDone ? `${c.color} border-transparent` : 'border-outline-variant bg-surface'} ${isCur ? 'ring-4 ring-primary/20' : ''}`} />
                            {!isLast && <div className={`flex-1 w-0.5 min-h-8 ${idx < currentStep ? 'bg-primary' : 'bg-outline-variant/40'}`} />}
                          </div>
                          <div className="pb-6">
                            <p className={`font-bold text-sm ${isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>{c.label}</p>
                            <p className="text-xs text-on-surface-variant">{c.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
