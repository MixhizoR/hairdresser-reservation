import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/admin', label: 'Kontrol Paneli', icon: 'dashboard', end: true },
  { to: '/admin/appointments', label: 'Randevular', icon: 'calendar_month' },
  { to: '/admin/services', label: 'Hizmetler', icon: 'content_cut' },
  { to: '/admin/stylists', label: 'Stilistler', icon: 'face' },
];

export default function AdminLayout({ currentUser, onLogout, token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(() => localStorage.getItem('admin_drawer_open') === 'true');
  const hamburgerRef = useRef(null);
  const drawerRef = useRef(null);
  const firstNavRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Persist drawer preference
  useEffect(() => {
    localStorage.setItem('admin_drawer_open', String(drawerOpen));
    // Prevent background scroll when drawer is open on mobile
    if (window.innerWidth < 768) {
      document.body.style.overflow = drawerOpen ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // ESC to close + focus trap
  useEffect(() => {
    if (!drawerOpen) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        hamburgerRef.current?.focus();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    // Focus first nav link when drawer opens
    setTimeout(() => firstNavRef.current?.focus(), 100);
    return () => document.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  const toggleDrawer = useCallback(() => {
    const next = !drawerOpen;
    setDrawerOpen(next);
    if (next) {
      // focus will be set by the effect above
    } else {
      hamburgerRef.current?.focus();
    }
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-screen bg-surface font-body">
      {/* ── Overlay (mobile only, when drawer open) ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar / Drawer ── */}
      <aside
        id="admin-drawer"
        ref={drawerRef}
        role="navigation"
        aria-label="Yönetim menüsü"
        className={`
          fixed left-0 top-0 h-screen w-64 bg-slate-50 border-r border-slate-200/20
          flex flex-col py-6 z-50
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-6 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>spa</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-blue-800 leading-tight">HairMan Yönetim</h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Yönetim</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={closeDrawer}
            className="md:hidden p-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Menüyü kapat"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-4" aria-label="Yönetim navigasyonu">
          {NAV.map(({ to, label, icon, end }, idx) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              ref={idx === 0 ? firstNavRef : undefined}
              onClick={() => { if (window.innerWidth < 768) setDrawerOpen(false); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
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
          <div className="h-px bg-slate-200/60" />
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-error transition-colors text-sm font-medium w-full rounded-xl min-h-[44px]"
          >
            <span className="material-symbols-outlined">logout</span>
            Çıkış
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* TopBar */}
        <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/10 shadow-sm shadow-blue-900/5 flex items-center justify-between px-4 md:px-8 py-3 h-16">
          {/* Hamburger (mobile) + Search */}
          <div className="flex items-center gap-3">
            <button
              ref={hamburgerRef}
              onClick={toggleDrawer}
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Menüyü aç/kapat"
              aria-expanded={drawerOpen}
              aria-controls="admin-drawer"
            >
              <span className="material-symbols-outlined text-slate-600 text-xl">
                {drawerOpen ? 'close' : 'menu'}
              </span>
            </button>
            <div className="relative w-40 sm:w-60 md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                placeholder="Seans, stilist ara..."
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate('/admin/appointments')}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right hidden md:block">
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
        <main className="flex-1 p-4 md:p-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
