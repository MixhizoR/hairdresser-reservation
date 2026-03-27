import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Ana Sayfa', href: '#home' },
    { label: 'Hizmetler', href: '#services' },
    { label: 'Stilistler', href: '#stylists' },
  ];

  const scrollTo = (id) => {
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => scrollToId(id), 300); }
    else scrollToId(id);
    setMobileOpen(false);
  };

  const scrollToId = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,96,173,0.06)]'
          : 'bg-white/60 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-blue-900">HairMan Studio</span>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollTo(l.href)}
              className="text-slate-500 hover:text-blue-700 font-medium transition-colors text-sm"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Right CTA — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/contact"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors px-4 py-2"
          >
            İletişim
          </Link>
          <Link
            to="/track"
            className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors px-4 py-2"
          >
            Randevu Takip
          </Link>
          <Link
            to="/book"
            className="btn-primary text-sm px-5 py-2.5"
          >
            Randevu Al
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-surface-container transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="material-symbols-outlined text-on-surface">
            {mobileOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-outline-variant/20 px-6 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <button
              key={l.label}
              onClick={() => scrollTo(l.href)}
              className="text-left py-2.5 text-sm font-medium text-on-surface hover:text-primary transition-colors"
            >
              {l.label}
            </button>
          ))}
          <hr className="border-outline-variant/30" />
          <Link to="/contact" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-medium text-on-surface-variant">
            İletişim
          </Link>
          <Link to="/track" onClick={() => setMobileOpen(false)} className="py-2 text-sm font-medium text-on-surface-variant">
            Randevu Takip
          </Link>
          <Link to="/book" onClick={() => setMobileOpen(false)} className="btn-primary text-sm text-center">
            Randevu Al
          </Link>
        </div>
      )}
    </header>
  );
}
