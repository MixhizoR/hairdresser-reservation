import { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-secondary-container text-lg">{icon}</span>
        </div>
      </div>
      <p className="text-4xl font-extrabold text-on-surface">{value ?? '—'}</p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}

const STATUS_COLOR = {
  pending: 'status-pending',
  approved: 'status-confirmed',
  completed: 'status-completed',
  rejected: 'status-rejected',
  cancelled: 'bg-slate-100 text-slate-500 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide',
};

export default function DashboardPage({ token, authHeaders }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/auth/dashboard`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        setStats(d.stats || null);
        setRecent(d.recentAppointments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Dashboard Overview</h2>
          <p className="text-on-surface-variant mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-on-surface-variant">{today}</p>
        </div>
      </div>

      {/* Revenue card */}
      <div className="bg-primary text-on-primary p-8 rounded-[2rem] shadow-2xl shadow-primary/10 relative overflow-hidden min-h-[180px] flex flex-col justify-between">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <span className="text-on-primary/70 font-semibold tracking-wide text-sm uppercase">Monthly Appointments</span>
            <div className="bg-on-primary/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              Active
            </div>
          </div>
          <p className="text-6xl font-extrabold mt-4">{loading ? '…' : stats?.totalAppointments ?? 0}</p>
          <p className="text-on-primary/60 text-sm mt-2 font-medium">
            {stats?.todayAppointments ?? 0} today · {stats?.pendingAppointments ?? 0} pending
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-on-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Pending" value={stats?.pendingAppointments} icon="schedule" sub="Awaiting confirmation" />
        <StatCard label="Approved" value={stats?.approvedAppointments} icon="check_circle" sub="Confirmed appointments" />
        <StatCard label="Completed" value={stats?.completedAppointments} icon="done_all" sub="Finished sessions" />
        <StatCard label="Active Barbers" value={stats?.activeBarbers} icon="face" sub="Working today" />
      </div>

      {/* Recent appointments */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-on-surface">Recent Appointments</h3>
          <a href="/admin/appointments" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            View all <span className="material-symbols-outlined text-base">arrow_forward</span>
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">calendar_month</span>
            <p className="font-medium">No appointments yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3 border-b border-surface-container last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary shrink-0 text-sm">
                    {(a.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{a.name}</p>
                    <p className="text-xs text-on-surface-variant">{a.service} · {a.barber?.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">
                    {new Date(a.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' '}
                    {new Date(a.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={STATUS_COLOR[a.status] || STATUS_COLOR.pending}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
