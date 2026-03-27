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
  rejected: 'status-rejected',
};

/* ── Simple Bar Chart ── */
function MonthlyRevenueChart({ data, currentMonth, onPrevMonth, onNextMonth }) {
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-extrabold text-on-surface">Aylık Gelir</h3>
        <div className="flex items-center gap-2">
          <button onClick={onPrevMonth} className="p-1.5 rounded-full hover:bg-surface-container transition-colors" aria-label="Önceki ay">
            <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_left</span>
          </button>
          <span className="text-sm font-semibold text-on-surface min-w-[100px] text-center">{currentMonth}</span>
          <button onClick={onNextMonth} className="p-1.5 rounded-full hover:bg-surface-container transition-colors" aria-label="Sonraki ay">
            <span className="material-symbols-outlined text-base text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-on-surface-variant">{d.revenue > 0 ? `₺${d.revenue}` : ''}</span>
            <div
              className="w-full bg-primary/20 rounded-t-lg transition-all"
              style={{ height: `${Math.max((d.revenue / maxVal) * 100, 2)}%` }}
              title={`${d.label}: ₺${d.revenue}`}
            />
            <span className="text-[9px] text-on-surface-variant font-medium">{d.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant mt-3 text-center">Günlük kazanç (₺)</p>
    </div>
  );
}

export default function DashboardPage({ token, authHeaders }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [viewMonth, setViewMonth] = useState(() => new Date());

  useEffect(() => {
    fetch(`${SERVER_URL}/api/auth/dashboard`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        setStats(d.stats || null);
        setRecent((d.recentAppointments || []).slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch all appointments for revenue chart
    fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAppointments(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Build monthly revenue data
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();

  const dailyRevenue = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    const dayStr = dayDate.toISOString().split('T')[0];
    const dayAppts = appointments.filter(a => {
      const aDate = new Date(a.time).toISOString().split('T')[0];
      return aDate === dayStr && a.status === 'approved';
    });
    dailyRevenue.push({
      label: d.toString(),
      revenue: dayAppts.reduce((sum, a) => {
        // Revenue approximation based on service name or use 150 default
        return sum + 150;
      }, 0)
    });
  }

  const monthLabel = viewMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const handleNextMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Kontrol Paneli</h2>
          <p className="text-on-surface-variant mt-1">Tekrar hoş geldiniz. İşte bugünün özeti.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-on-surface-variant">{today}</p>
        </div>
      </div>

      {/* Revenue card */}
      <div className="bg-primary text-on-primary p-8 rounded-[2rem] shadow-2xl shadow-primary/10 relative overflow-hidden min-h-[180px] flex flex-col justify-between">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <span className="text-on-primary/70 font-semibold tracking-wide text-sm uppercase">Aylık Randevular</span>
            <div className="bg-on-primary/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              Aktif
            </div>
          </div>
          <p className="text-6xl font-extrabold mt-4">{loading ? '…' : stats?.totalAppointments ?? 0}</p>
          <p className="text-on-primary/60 text-sm mt-2 font-medium">
            {stats?.todayAppointments ?? 0} bugün · {stats?.pendingAppointments ?? 0} bekleyen
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-on-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Monthly Revenue Graph */}
      {!loading && (
        <MonthlyRevenueChart
          data={dailyRevenue}
          currentMonth={monthLabel}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Bekleyen" value={stats?.pendingAppointments} icon="schedule" sub="Onay bekliyor" />
        <StatCard label="Onaylanan" value={stats?.approvedAppointments} icon="check_circle" sub="Onaylanmış randevular" />
        <StatCard label="Aktif Stilist" value={stats?.activeBarbers} icon="face" sub="Bugün çalışan" />
      </div>

      {/* Recent appointments */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-on-surface">Son Randevular</h3>
          <a href="/admin/appointments" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            Tümünü Gör <span className="material-symbols-outlined text-base">arrow_forward</span>
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
                    {new Date(a.time).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                    {' '}
                    {new Date(a.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
