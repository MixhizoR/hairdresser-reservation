import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

export default function ContactPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/settings`)
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface font-body">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-sm">location_on</span>
            Bize Ulaşın
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface mb-3">İletişim</h1>
          <p className="text-on-surface-variant text-lg max-w-xl">
            {settings?.salonDescription || 'Premium kuaför deneyimi için bize ulaşın.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
              <h2 className="text-xl font-extrabold text-on-surface mb-6">İletişim Bilgileri</h2>
              <div className="flex flex-col gap-5">
                {settings?.contactLocation && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Adres</p>
                      <p className="font-semibold text-on-surface">{settings.contactLocation}</p>
                    </div>
                  </div>
                )}
                {settings?.contactPhone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">phone</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Telefon</p>
                      <p className="font-semibold text-on-surface">{settings.contactPhone}</p>
                    </div>
                  </div>
                )}
                {settings?.contactEmail && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">email</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">E-posta</p>
                      <p className="font-semibold text-on-surface">{settings.contactEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
            <h2 className="text-xl font-extrabold text-on-surface mb-6">Konum</h2>
            <div
              className="w-full aspect-video bg-surface-container rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant"
              role="img"
              aria-label="Harita yer tutucusu - konum haritası burada görüntülenecek"
            >
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">map</span>
              <p className="text-sm font-semibold text-on-surface-variant">Harita Burada Görüntülenecek</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Google Maps veya OpenStreetMap embed</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-primary text-on-primary rounded-[2rem] p-10 md:p-16 text-center">
          <h2 className="text-3xl font-extrabold mb-3">Randevu Almaya Hazır mısınız?</h2>
          <p className="text-on-primary/80 mb-6 max-w-md mx-auto">Hemen online randevu oluşturun, dakikalar içinde onaylayın.</p>
          <a href="/book" className="inline-block bg-on-primary text-primary font-bold rounded-full px-10 py-4 text-lg hover:bg-on-primary/90 transition-all">
            Randevu Al →
          </a>
        </div>
      </div>
    </div>
  );
}
