import React, { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

const DAYS_TR = {
  monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
  thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
};

export default function SettingsPage({ token, authHeaders, audioEnabled, toggleAudio }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${SERVER_URL}/api/settings`)
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  const updateSetting = (key, value) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  const updateHour = (day, field, value) => {
    setSettings(s => {
      const hours = { ...(s.operatingHours || {}) };
      hours[day] = { ...(hours[day] || { open: '09:00', close: '20:00', closed: false }), [field]: value };
      return { ...s, operatingHours: hours };
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${SERVER_URL}/api/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      if (res.ok) setMsg('Ayarlar kaydedildi.');
      else setMsg('Kayıt başarısız.');
    } catch { setMsg('Bir hata oluştu.'); }
    finally { setSaving(false); }
  };

  if (!settings) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const hours = settings.operatingHours || {};

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Ayarlar</h2>
        <p className="text-on-surface-variant mt-1">Salon tercihlerinizi yönetin</p>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">{msg}</div>
      )}

      {/* Notification Preferences */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
        <h3 className="font-extrabold text-on-surface mb-6">Bildirim Tercihleri</h3>
        <div className="flex items-center justify-between py-4 border-b border-surface-container">
          <div>
            <p className="font-semibold text-on-surface text-sm">Ses Bildirimleri</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Yeni randevu geldiğinde ses çal</p>
          </div>
          <button
            onClick={toggleAudio}
            className={`w-12 h-6 rounded-full transition-all relative ${audioEnabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${audioEnabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Salon Profile */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
        <h3 className="font-extrabold text-on-surface mb-6">Salon Profili</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Salon Adı</label>
            <input className="input-base" value={settings.salonName || ''} onChange={e => updateSetting('salonName', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Açıklama</label>
            <textarea className="input-base resize-none h-20" value={settings.salonDescription || ''} onChange={e => updateSetting('salonDescription', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Telefon</label>
              <input className="input-base" value={settings.contactPhone || ''} onChange={e => updateSetting('contactPhone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">E-posta</label>
              <input className="input-base" value={settings.contactEmail || ''} onChange={e => updateSetting('contactEmail', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Adres</label>
            <input className="input-base" value={settings.contactLocation || ''} onChange={e => updateSetting('contactLocation', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow">
        <h3 className="font-extrabold text-on-surface mb-6">Çalışma Saatleri</h3>
        <div className="flex flex-col gap-3">
          {Object.entries(DAYS_TR).map(([day, label]) => {
            const h = hours[day] || { open: '09:00', close: '20:00', closed: false };
            return (
              <div key={day} className="flex items-center gap-4 py-3 border-b border-surface-container last:border-0">
                <span className="w-28 text-sm font-semibold text-on-surface">{label}</span>
                {h.closed ? (
                  <span className="text-sm text-on-surface-variant">Kapalı</span>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" className="input-base w-28" value={h.open} onChange={e => updateHour(day, 'open', e.target.value)} step="1800" min="08:30" max="19:00" />
                    <span className="text-on-surface-variant">—</span>
                    <input type="time" className="input-base w-28" value={h.close} onChange={e => updateHour(day, 'close', e.target.value)} step="1800" min="08:30" max="19:00" />
                  </div>
                )}
                <button
                  onClick={() => updateHour(day, 'closed', !h.closed)}
                  className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${h.closed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                >
                  {h.closed ? 'Kapalı' : 'Açık'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary py-4 px-8 flex items-center gap-2">
        {saving ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : 'Ayarları Kaydet'}
      </button>
    </div>
  );
}
