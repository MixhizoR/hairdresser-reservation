import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/* ──────────────────────────────────────────────────────────────────
   Navbar – WCAG AA compliant, BEM-classed, RTL-ready, keyboard-first
   
   Design tokens (inherited from index.css):
     --color-primary: #0060ad
     --color-on-primary: #f8f8ff
     --color-surface: #f7f9fb
     --color-on-surface: #2c3437
     --color-on-surface-variant: #596064
     --color-surface-container: #eaeff2
     --color-outline-variant: #acb3b7
   
   Focus ring: 2px solid #0060ad, offset 2px (4.5:1 contrast)
   Touch target: min 44×44 px (WCAG 2.5.8)
   Reduced motion: respects prefers-reduced-motion
   RTL: uses logical properties; dir="auto" support
   ────────────────────────────────────────────────────────────────── */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);
  const firstLinkRef = useRef(null);

  /* ── Scroll listener ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close drawer on Escape ── */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  /* ── Focus trap inside drawer ── */
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusables = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    drawer.addEventListener('keydown', trap);
    first.focus();
    return () => drawer.removeEventListener('keydown', trap);
  }, [mobileOpen]);

  /* ── Nav data ── */
  const navLinks = [
    { label: 'Ana Sayfa', href: '#home' },
    { label: 'Hizmetler', href: '#services' },
    { label: 'Stilistler', href: '#stylists' },
  ];

  const scrollTo = useCallback((id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollToId(id), 300);
    } else {
      scrollToId(id);
    }
    setMobileOpen(false);
  }, [location.pathname, navigate]);

  const scrollToId = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isActive = (href) => {
    if (href === '#home' && location.pathname === '/') return true;
    return false;
  };

  return (
    <>
      {/* ── Skip to content (a11y) ── */}
      <a
        href="#main-content"
        className="navbar__skip-link"
        data-testid="skip-to-content"
      >
        İçeriğe atla
      </a>

      <header
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        role="banner"
        dir="ltr"
      >
        <div className="navbar__container">
          {/* ── Brand ── */}
          <Link
            to="/"
            className="navbar__brand"
            aria-label="HairMan Studio ana sayfaya git"
          >
            <div className="navbar__logo" aria-hidden="true">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <span className="navbar__brand-text">HairMan Studio</span>
          </Link>

          {/* ── Primary nav (desktop) ── */}
          <nav
            className="navbar__nav"
            aria-label="Ana navigasyon"
          >
            <ul className="navbar__nav-list" role="list">
              {navLinks.map((l) => (
                <li key={l.label} className="navbar__nav-item">
                  <a
                    href={l.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(l.href); }}
                    className={`navbar__nav-link ${isActive(l.href) ? 'navbar__nav-link--active' : ''}`}
                    aria-current={isActive(l.href) ? 'page' : undefined}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Actions (desktop) ── */}
          <div className="navbar__actions">
            <Link
              to="/contact"
              className="navbar__action-link"
              aria-label="İletişim sayfasına git"
            >
              İletişim
            </Link>
            <Link
              to="/track"
              className="navbar__action-link"
              aria-label="Randevu takip sayfasına git"
            >
              Randevu Takip
            </Link>
            <Link
              to="/book"
              className="navbar__cta"
              aria-label="Yeni randevu oluştur"
            >
              Randevu Al
            </Link>
          </div>

          {/* ── Hamburger (mobile) ── */}
          <button
            ref={hamburgerRef}
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
            aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            <span className="navbar__hamburger-icon" aria-hidden="true">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          id="mobile-drawer"
          ref={drawerRef}
          className={`navbar__drawer ${mobileOpen ? 'navbar__drawer--open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobil navigasyon menüsü"
          hidden={!mobileOpen}
        >
          <nav aria-label="Mobil navigasyon">
            <ul className="navbar__drawer-list" role="list">
              {navLinks.map((l, idx) => (
                <li key={l.label} className="navbar__drawer-item">
                  <a
                    ref={idx === 0 ? firstLinkRef : undefined}
                    href={l.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(l.href); }}
                    className={`navbar__drawer-link ${isActive(l.href) ? 'navbar__drawer-link--active' : ''}`}
                    aria-current={isActive(l.href) ? 'page' : undefined}
                    tabIndex={mobileOpen ? 0 : -1}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <hr className="navbar__drawer-separator" aria-hidden="true" />
            <ul className="navbar__drawer-list" role="list">
              <li className="navbar__drawer-item">
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="navbar__drawer-link"
                  tabIndex={mobileOpen ? 0 : -1}
                >
                  İletişim
                </Link>
              </li>
              <li className="navbar__drawer-item">
                <Link
                  to="/track"
                  onClick={() => setMobileOpen(false)}
                  className="navbar__drawer-link"
                  tabIndex={mobileOpen ? 0 : -1}
                >
                  Randevu Takip
                </Link>
              </li>
              <li className="navbar__drawer-item">
                <Link
                  to="/book"
                  onClick={() => setMobileOpen(false)}
                  className="navbar__drawer-cta"
                  tabIndex={mobileOpen ? 0 : -1}
                >
                  Randevu Al
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* ── Backdrop overlay ── */}
        {mobileOpen && (
          <div
            className="navbar__backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </header>
    </>
  );
}
