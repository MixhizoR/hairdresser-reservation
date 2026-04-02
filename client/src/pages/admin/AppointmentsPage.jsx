import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';
const FILTERS = ['all', 'pending', 'approved', 'rejected'];
const FILTER_LABELS = { all: 'Tümü', pending: 'Bekleyen', approved: 'Onaylanan', rejected: 'Reddedilen' };

const STATUS_STYLE = {
  pending: 'status-pending',
  approved: 'status-confirmed',
  rejected: 'status-rejected',
};

const STATUS_LABELS = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

/* ── Polling: fetch every 15 seconds ── */
function useAppointmentsPolling(token, authHeadersFn) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevPendingCount, setPrevPendingCount] = useState(0);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments`, { headers: authHeadersFn() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const newPending = list.filter(a => a.status === 'pending').length;
      if (newPending > prevPendingCount && prevPendingCount !== 0) {
        window.dispatchEvent(new CustomEvent('new-pending'));
      }
      setPrevPendingCount(newPending);
      setAppointments(list);
      setLoading(false);
    } catch { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 15000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { appointments, loading, refresh: fetch_ };
}

export default function AppointmentsPage({ token, authHeaders, audioEnabled, playSynth }) {
  const { appointments, loading, refresh } = useAppointmentsPolling(token, authHeaders);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  /* Play sound on new pending */
  useEffect(() => {
    const handler = () => { if (audioEnabled) playSynth(); };
    window.addEventListener('new-pending', handler);
    return () => window.removeEventListener('new-pending', handler);
  }, [audioEnabled]);

  const updateStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) await refresh();
    } finally { setActionLoading(null); }
  };

  const deleteAppointment = async (id) => {
    if (!confirm('Bu randevuyu silmek istiyor musunuz?')) return;
    setActionLoading(id + 'del');
    try {
      await fetch(`${SERVER_URL}/api/appointments/${id}`, { method: 'DELETE', headers: authHeaders() });
      await refresh();
    } finally { setActionLoading(null); }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Randevular</h2>
          <p className="text-on-surface-variant mt-1">
            {pendingCount > 0 && (
              <span className="text-amber-600 font-semibold">{pendingCount} onay bekliyor · </span>
            )}
            {appointments.length} toplam
          </p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <span className="material-symbols-outlined text-base">refresh</span> Yenile
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === f
                ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            {FILTER_LABELS[f] || f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-white rounded-full text-[10px] px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">event_busy</span>
            <p className="font-medium">Henüz randevu yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant">
                  <th className="text-left px-6 py-4 font-bold whitespace-nowrap" style={{ width: '15%' }}>Saat</th>
                  <th className="text-left px-6 py-4 font-bold whitespace-nowrap" style={{ width: '20%' }}>Müşteri</th>
                  <th className="text-left px-6 py-4 font-bold whitespace-nowrap hidden md:table-cell" style={{ width: '18%' }}>Stilist</th>
                  <th className="text-left px-6 py-4 font-bold whitespace-nowrap hidden md:table-cell" style={{ width: '17%' }}>Hizmet</th>
                  <th className="text-left px-6 py-4 font-bold whitespace-nowrap" style={{ width: '12%' }}>Durum</th>
                  <th className="text-left px-6 py-4 font-bold whitespace-nowrap" style={{ width: '18%' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <p className="font-bold text-sm text-on-surface">
                        {new Date(a.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(a.time).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <p className="font-semibold text-sm text-on-surface overflow-hidden text-ellipsis">{a.name}</p>
                      <p className="text-xs text-on-surface-variant">{a.phone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(a.barber?.name || '?')[0]}
                        </div>
                        <span className="text-sm text-on-surface">{a.barber?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface whitespace-nowrap min-w-0 hidden md:table-cell overflow-hidden text-ellipsis">{a.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <span className={STATUS_STYLE[a.status] || STATUS_STYLE.pending}>{STATUS_LABELS[a.status] || a.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <div className="flex items-center gap-1">
                        {a.status === 'pending' && (
                          <>
                            <button
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(a.id, 'approved')}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                              title="Onayla"
                            >
                              <span className="material-symbols-outlined text-base">check</span>
                            </button>
                            <button
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(a.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                              title="Reddet"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </>
                        )}
                        <button
                          disabled={!!actionLoading}
                          onClick={() => deleteAppointment(a.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="Sil"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
