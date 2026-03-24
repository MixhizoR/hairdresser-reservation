import { useState } from 'react';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  pending:   { label: 'Pending', color: 'bg-amber-500', desc: 'Awaiting confirmation from your stylist.', icon: 'schedule' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', desc: 'Your appointment is confirmed. See you soon!', icon: 'check_circle' },
  completed: { label: 'Completed', color: 'bg-green-500', desc: 'Service completed. Thank you for visiting!', icon: 'done_all' },
  rejected:  { label: 'Rejected', color: 'bg-error', desc: 'Unfortunately your appointment was rejected.', icon: 'cancel' },
};

const ALL_STATUSES_ORDER = ['pending', 'confirmed', 'completed'];

export default function TrackPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/appointments/track/${query.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Appointment not found');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };
  const fmtTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusKey = result?.status?.toLowerCase() || 'pending';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const currentStep = ALL_STATUSES_ORDER.indexOf(statusKey);

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* ── LEFT: Info panel ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Appointment Tracker</span>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface leading-tight mb-3">
                Track Your<br />Appointment
              </h1>
              <p className="text-on-surface-variant">Enter your appointment ID to see its current status.</p>
            </div>

            {result && statusKey !== 'rejected' && (
              <>
                {/* Big ID card */}
                <div className="inline-flex items-center gap-3 bg-surface-container rounded-full px-6 py-4 self-start">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Appointment ID</p>
                    <p className="font-extrabold text-on-surface text-xl">#{result.id}</p>
                  </div>
                </div>

                {/* Barber info */}
                {result.barber && (
                  <div className="flex items-center gap-4 bg-surface-container rounded-full px-4 py-3 self-start">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary">
                      {result.barber.name[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Your Stylist</p>
                      <p className="font-bold text-on-surface text-sm">{result.barber.name}</p>
                    </div>
                  </div>
                )}

                {/* Appointment details */}
                <div className="bg-surface-container-highest rounded-[2rem] px-8 py-6 flex flex-col gap-3">
                  {result.service && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Service</span>
                      <span className="font-bold text-on-surface">{result.service.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Date</span>
                    <span className="font-bold text-on-surface">{fmt(result.appointmentTime)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Time</span>
                    <span className="font-bold text-on-surface">{fmtTime(result.appointmentTime)}</span>
                  </div>
                  {result.clientName && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Client</span>
                      <span className="font-bold text-on-surface">{result.clientName}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: Search + Status ── */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Search card */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
              <h2 className="text-xl font-extrabold text-on-surface mb-2">Find Your Appointment</h2>
              <p className="text-sm text-on-surface-variant mb-6">Enter the appointment ID you received after booking.</p>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder="e.g. 42"
                    className="input-base pl-12"
                  />
                </div>
                <button
                  onClick={search}
                  disabled={loading}
                  className="btn-primary px-6 shrink-0 flex items-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : 'Search'}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}
            </div>

            {/* Status Result */}
            {result && (
              <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
                {/* Current status badge */}
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-12 h-12 rounded-full ${statusCfg.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {statusCfg.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-extrabold text-on-surface text-xl">{statusCfg.label}</p>
                    <p className="text-sm text-on-surface-variant">{statusCfg.desc}</p>
                  </div>
                </div>

                {/* Timeline */}
                {statusKey !== 'rejected' && (
                  <div className="flex flex-col gap-0">
                    {ALL_STATUSES_ORDER.map((s, idx) => {
                      const cfg = STATUS_CONFIG[s];
                      const isDone = idx <= currentStep;
                      const isCur  = idx === currentStep;
                      const isLast = idx === ALL_STATUSES_ORDER.length - 1;
                      return (
                        <div key={s} className="flex gap-4">
                          {/* Line + circle */}
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 ${
                              isDone ? `${cfg.color} border-transparent` : 'border-outline-variant bg-surface'
                            } ${isCur ? 'ring-4 ring-primary/20' : ''}`} />
                            {!isLast && (
                              <div className={`flex-1 w-0.5 min-h-[32px] ${idx < currentStep ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                            )}
                          </div>
                          {/* Label */}
                          <div className="pb-6">
                            <p className={`font-bold text-sm ${isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                              {cfg.label}
                            </p>
                            <p className="text-xs text-on-surface-variant">{cfg.desc}</p>
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
