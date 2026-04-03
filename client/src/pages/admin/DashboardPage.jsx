import React, { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl sm:rounded-[2rem] p-3 sm:p-5 ambient-shadow flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '16px' }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-on-surface">{value ?? '—'}</p>
      {sub && <p className="text-[10px] sm:text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}

const STATUS_COLOR = {
  pending: 'status-pending',
  approved: 'status-confirmed',
  rejected: 'status-rejected',
};

const STATUS_LABELS = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

function MonthlyRevenueChart({ data, currentMonth, onPrevMonth, onNextMonth }) {
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="bg-surface-container-lowest rounded-2xl sm:rounded-[2rem] p-3 sm:p-5 ambient-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <h3 className="text-sm sm:text-base font-extrabold text-on-surface">Aylık Gelir</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Önceki ay"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <span className="text-[10px] sm:text-xs font-semibold text-on-surface min-w-[70px] sm:min-w-[90px] text-center">{currentMonth}</span>
          <button
            onClick={onNextMonth}
            className="p-1 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Sonraki ay"
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      </div>
      <div className="flex items-end gap-[3px] sm:gap-1 h-24 sm:h-32 overflow-x-auto no-scrollbar">
        {data.map((d, i) => (
          <div key={i} className="flex-1 min-w-[8px] sm:min-w-[18px] flex flex-col items-center gap-1">
            <div
              className="w-full bg-primary/20 rounded-t transition-all"
              style={{ height: `${Math.max((d.revenue / maxVal) * 100, 2)}% ` }}
              title={`${d.label}: ₺${d.revenue} `}
            />
            <span className="text-[6px] sm:text-[8px] text-on-surface-variant font-medium">{d.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] sm:text-xs text-on-surface-variant mt-2 text-center">Günlük kazanç (₺)</p>
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

    fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAppointments(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, [token]);

  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

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
      revenue: dayAppts.length * 150
    });
  }

  const monthLabel = viewMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const handlePrevMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const handleNextMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="space-y-5 pb-6">

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-end">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Kontrol Paneli</h2>
          <p className="text-on-surface-variant text-sm mt-0.5">Tekrar hoş geldiniz. İşte bugünün özeti.</p>
        </div>
        <p className="text-xs font-medium text-on-surface-variant">{today}</p>
      </div>

      {/* Revenue hero card */}
      <div className="bg-primary text-on-primary p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl shadow-primary/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <span className="text-on-primary/70 font-semibold tracking-wide text-[10px] sm:text-xs uppercase">Toplam Randevular</span>
            <div className="bg-on-primary/20 backdrop-blur-md px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>trending_up</span>
              Aktif
            </div>
          </div>
          <p className="text-4xl sm:text-5xl font-extrabold mt-2 sm:mt-3">{loading ? '…' : stats?.totalAppointments ?? 0}</p>
          <p className="text-on-primary/60 text-xs sm:text-sm mt-1 font-medium">
            {stats?.todayAppointments ?? 0} bugün · {stats?.pendingAppointments ?? 0} bekleyen
          </p>
        </div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-on-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stat grid — 2 cols on mobile, 3 on lg */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="Bekleyen" value={stats?.pendingAppointments} icon="schedule" sub="Onay bekliyor" />
        <StatCard label="Onaylanan" value={stats?.approvedAppointments} icon="check_circle" sub="Onaylanmış" />
        <div className="col-span-1">
          <StatCard label="Aktif Stilist" value={stats?.activeBarbers} icon="face" sub="Bugün çalışan" />
        </div>
      </div>

      {/* Chart */}
      {!loading && (
        <MonthlyRevenueChart
          data={dailyRevenue}
          currentMonth={monthLabel}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      )}

      {/* Recent appointments */}
      <div className="bg-surface-container-lowest rounded-2xl sm:rounded-[2rem] p-3 sm:p-5 ambient-shadow">
        <div className="flex justify-between items-center mb-3 sm:mb-5">
          <h3 className="text-sm sm:text-base font-extrabold text-on-surface">Son Randevular</h3>

          <a
            href="/admin/appointments"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
          >
            Tümü <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">calendar_month</span>
            <p className="text-sm font-medium">Henüz randevu yok</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {recent.map((a, idx) => (
              <div
                key={a.id}
                className={`flex items-center justify-between py-3 ${idx < recent.length - 1 ? 'border-b border-surface-container' : ''}`}
              >
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-bold text-primary shrink-0 text-sm">
                    {(a.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface text-sm truncate">{a.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {a.service}
                      {a.barber?.name ? ` · ${a.barber.name} ` : ''}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <span className="text-xs text-on-surface-variant whitespace-nowrap">
                    {new Date(a.time).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                    {' '}
                    {new Date(a.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={STATUS_COLOR[a.status] || STATUS_COLOR.pending}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}