import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/admin', label: 'Kontrol Paneli', icon: 'dashboard', end: true },
  { to: '/admin/appointments', label: 'Randevular', icon: 'calendar_month' },
  { to: '/admin/services', label: 'Hizmetler', icon: 'content_cut' },
  { to: '/admin/stylists', label: 'Stilistler', icon: 'face' },
  { to: '/admin/settings', label: 'Ayarlar', icon: 'settings' },
];

export default function AdminLayout({ currentUser, onLogout, token }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  return (
    <div className="flex min-h-screen bg-surface font-body">
      {/* ── Sidebar ── */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-slate-200/20 flex flex-col py-6 z-50">
        {/* Logo */}
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>spa</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-blue-800 leading-tight">HairMan Admin</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Yönetim</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-4">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 mt-auto space-y-3">
          <button
            onClick={() => navigate('/book')}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Yeni Randevu
          </button>
          <div className="h-px bg-slate-200/60" />
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-error transition-colors text-sm font-medium w-full rounded-xl"
          >
            <span className="material-symbols-outlined">logout</span>
            Çıkış
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* TopBar */}
        <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/10 shadow-sm shadow-blue-900/5 flex items-center justify-between px-8 py-3 h-16">
          {/* Search */}
          <div className="relative w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              placeholder="Seans, stilist ara..."
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/appointments')}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-on-surface">{currentUser?.name || currentUser?.username || 'Admin'}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Yönetici</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm border-2 border-primary-container">
                {(currentUser?.name || currentUser?.username || 'A')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
