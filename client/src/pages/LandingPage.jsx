import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

/* ─── helpers ─── */
const UNSPLASH_HERO =
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80';

const UNSPLASH_BARBERS = [
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?auto=format&fit=crop&w=400&q=80',
];

function ServiceCard({ service, featured, accent }) {
  const bg = featured
    ? 'bg-primary text-on-primary'
    : accent
    ? 'bg-tertiary-container text-on-tertiary-container'
    : 'bg-surface-container-lowest text-on-surface';

  return (
    <div
      className={`${bg} rounded-[2rem] p-8 card-hover ambient-shadow flex flex-col gap-4 ${
        featured ? 'md:col-span-2 relative overflow-hidden' : ''
      }`}
    >
      {featured && (
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-on-primary/10 blur-3xl pointer-events-none" />
      )}
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-extrabold tracking-tight">{service.name}</h3>
        <span className={`font-extrabold text-lg ${featured ? 'text-on-primary/80' : 'text-primary'}`}>
          ₺{service.price}
        </span>
      </div>
      <p className="text-sm leading-relaxed opacity-80">{service.description || 'Size özel hazırlanmış premium kuaför deneyimi.'}</p>
      <div className="flex items-center gap-4 text-xs opacity-70 mt-auto">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
          {service.duration} dk
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>star</span>
          {service.category || 'Premium'}
        </span>
      </div>
      {featured && (
        <button
          className="mt-4 self-start bg-on-primary/20 hover:bg-on-primary/30 text-on-primary font-bold rounded-full px-6 py-2.5 text-sm transition-all"
        >
          Book Package →
        </button>
      )}
    </div>
  );
}

function BarberCard({ barber, photoUrl, index }) {
  const LEVEL_COLORS = {
    JUNIOR: 'bg-slate-100 text-slate-600',
    SENIOR: 'bg-blue-50 text-blue-700',
    MASTER: 'bg-amber-50 text-amber-700',
    DIRECTOR: 'bg-purple-50 text-purple-700',
  };
  const level = barber.level || 'SENIOR';

  return (
    <div className="relative overflow-hidden rounded-[2rem] group cursor-pointer">
      <img
        src={barber.photoUrl || photoUrl}
        alt={barber.name}
        className="w-full h-80 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        onError={(e) => { e.target.src = UNSPLASH_BARBERS[index % UNSPLASH_BARBERS.length]; }}
      />
      {/* Level badge */}
      <span
        className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
          LEVEL_COLORS[level] || LEVEL_COLORS.SENIOR
        }`}
      >
        {level}
      </span>
      {/* Glass overlay */}
      <div className="absolute bottom-4 left-4 right-4 glass-card bg-white/70 backdrop-blur-md rounded-full px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-on-surface">{barber.name}</p>
          <p className="text-xs text-on-surface-variant">{barber.speciality || barber.level || 'Grooming Expert'}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/barbers')
      .then((r) => r.json())
      .then((d) => setBarbers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const displayServices = services.length > 0
    ? services.slice(0, 5)
    : [];

  const displayBarbers = barbers.length > 0
    ? barbers
    : [];

  return (
    <div className="bg-surface text-on-surface font-body">
      <Navbar />

      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/80 to-transparent z-10" />
          <img
            className="w-full h-full object-cover"
            src={UNSPLASH_HERO}
            alt="HairMan Studio"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6">
              Kuaförlükte Mükemmellik
            </span>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.08] mb-6">
              Sabah Ritüeliniz<br />
              <span className="text-primary">Yeniden</span> Tanımlandı.
            </h1>
            <p className="text-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
              Her detayın önemli olduğu bir dünyaya adım atın. Modern beyefendi için hazırlanmış premium kuaför deneyimleri.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/book')}
                className="btn-primary text-base px-8 py-4"
              >
                Randevu Al
              </button>
              <button
                onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-base px-8 py-4"
              >
                Hizmetleri Gör
              </button>
            </div>
          </div>
        </div>

        {/* Floating stats */}
        <div className="absolute bottom-10 right-10 z-20 hidden lg:flex gap-4">
          {[
            { label: 'Mutlu Müşteri', value: '2.4K+' },
            { label: 'Deneyim', value: '12 Yıl' },
            { label: 'Puan', value: '4.9 ★' },
          ].map((s) => (
            <div key={s.label} className="glass-card bg-white/70 rounded-2xl px-5 py-4 text-center ambient-shadow">
              <p className="text-2xl font-extrabold text-primary">{s.value}</p>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="bg-surface-container py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">
                Özenle Seçilmiş Hizmetler
              </h2>
              <p className="text-on-surface-variant max-w-sm">
                Her hizmet, sadece bir kesim değil, özenle hazırlanmış bir deneyimdir.
              </p>
            </div>
            <button
              onClick={() => navigate('/book')}
              className="hidden md:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Hizmet Seç
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayServices.slice(0, 2).map((s, i) => (
              <ServiceCard key={s.id} service={s} accent={i === 1} />
            ))}
            {displayServices[2] && (
              <ServiceCard service={displayServices[2]} featured />
            )}
          </div>
        </div>
      </section>

      {/* ── STYLISTS ── */}
      <section id="stylists" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Ekibimiz</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">Uzmanlarla Tanışın</h2>
            <p className="text-on-surface-variant max-w-sm">
              Alanında ustalaşmış ekibimiz, sizi olağanüstü hissettirmeye adanmış.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayBarbers.map((b, i) => (
              <BarberCard
                key={b.id}
                barber={b}
                photoUrl={UNSPLASH_BARBERS[i % UNSPLASH_BARBERS.length]}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-container-lowest rounded-[2rem] p-10 md:p-16 flex flex-col md:flex-row justify-between items-center gap-10 ambient-shadow">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">
                Sığınacağınızı bulmaya hazır mısınız?
              </h2>
              <p className="text-on-surface-variant max-w-md">
                Randevunuzu 60 saniyeden kısa sürede oluşturun. Hesap gerekmez.
              </p>
            </div>
            <button
              onClick={() => navigate('/book')}
              className="shrink-0 bg-primary text-on-primary font-bold rounded-full px-10 py-5 text-lg shadow-xl shadow-primary/25 hover:bg-primary-dim transition-all"
            >
              Randevu Al →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-surface-container py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>spa</span>
            </div>
            <span className="font-bold text-on-surface">HairMan Studio</span>
          </div>
          <p>© {new Date().getFullYear()} HairMan Studio. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <button onClick={() => navigate('/book')} className="hover:text-primary transition-colors">Randevu Al</button>
            <button onClick={() => navigate('/track')} className="hover:text-primary transition-colors">Takip Et</button>
            <button onClick={() => navigate('/iletisim')} className="hover:text-primary transition-colors">İletişim</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
