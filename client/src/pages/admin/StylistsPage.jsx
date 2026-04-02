import { useState, useEffect, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';
const LEVELS = ['JUNIOR', 'SENIOR', 'MASTER', 'DIRECTOR'];
const LEVEL_LABELS = { JUNIOR: 'Çırak', SENIOR: 'Kıdemli', MASTER: 'Usta', DIRECTOR: 'Direktör' };
const LEVEL_STYLE = {
  JUNIOR: 'bg-slate-100 text-slate-600',
  SENIOR: 'bg-blue-50 text-blue-700',
  MASTER: 'bg-amber-50 text-amber-700',
  DIRECTOR: 'bg-purple-50 text-purple-700',
};

function StylistModal({ stylist, onClose, onSave }) {
  const [form, setForm] = useState({
    name: stylist?.name || '',
    username: stylist?.username || '',
    password: '',
    phone: stylist?.phone || '',
    level: stylist?.level || 'SENIOR',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(stylist?.photoUrl ? `${SERVER_URL}${stylist.photoUrl}` : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const maskPhone = (val) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length === 0) return '';
    let masked = '0';
    if (clean.startsWith('0')) clean = clean.slice(1);
    const part1 = clean.slice(0, 3);
    const part2 = clean.slice(3, 6);
    const part3 = clean.slice(6, 8);
    const part4 = clean.slice(8, 10);
    if (part1) masked += ` (${part1}`;
    if (part1.length === 3) masked += ')';
    if (part2) masked += ` ${part2}`;
    if (part3) masked += ` ${part3}`;
    if (part4) masked += ` ${part4}`;
    return masked;
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.username) { setError('Ad ve kullanıcı adı zorunludur.'); return; }
    if (!stylist && !form.password) { setError('Yeni stilistler için şifre zorunludur.'); return; }
    if (form.password && form.password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone && !/^05\d{9}$/.test(cleanPhone)) { setError('Format: 05xxxxxxxxx (05 ile başlamalıdır)'); return; }
    setLoading(true);
    setError('');
    try {
      // Use FormData because we might upload a photo
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('username', form.username);
      if (form.password) fd.append('password', form.password);
      fd.append('phone', form.phone.replace(/\D/g, ''));
      fd.append('level', form.level);
      if (photoFile) fd.append('photo', photoFile);
      await onSave(fd);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg ambient-shadow max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-extrabold text-on-surface mb-6">{stylist ? 'Stilisti Düzenle' : 'Yeni Stilist Ekle'}</h3>

        {error && <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        {/* Photo upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-outline-variant rounded-[2rem] p-6 text-center cursor-pointer hover:border-primary transition-colors mb-6 relative overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-24 h-24 rounded-full object-cover mx-auto" />
          ) : (
            <>
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2 block">add_photo_alternate</span>
              <p className="text-sm text-on-surface-variant font-medium">Fotoğraf yüklemek için tıklayın</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Maks 5MB · JPG, PNG, WebP</p>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Ad Soyad *</label>
              <input className="input-base" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ahmet Yılmaz" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Kullanıcı Adı *</label>
              <input className="input-base" value={form.username} onChange={e => update('username', e.target.value)} placeholder="alex_barber" disabled={!!stylist} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
              Şifre {stylist ? '(değiştirmek istemiyorsanız boş bırakın)' : '*'}
            </label>
            <input type="password" className="input-base" value={form.password} onChange={e => update('password', e.target.value)} placeholder="En az 8 karakter" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Seviye</label>
              <select className="input-base" value={form.level} onChange={e => update('level', e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l] || l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Telefon (11 Hane)</label>
              <input className="input-base" value={form.phone} onChange={e => update('phone', maskPhone(e.target.value))} placeholder="0 (5__) ___ __ __" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 btn-secondary py-3">İptal</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : stylist ? 'Kaydet' : 'Stilist Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StylistsPage({ token, authHeaders }) {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    fetch(`${SERVER_URL}/api/barbers/all`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setStylists(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSave = async (formData) => {
    const isEdit = modal && typeof modal === 'object';
    const url = isEdit ? `${SERVER_URL}/api/barbers/${modal.id}` : `${SERVER_URL}/api/barbers`;
    const method = isEdit ? 'PUT' : 'POST';
    // FormData — do NOT set Content-Type, browser does it with boundary
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(url, { method, headers, body: formData });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Kaydetme başarısız oldu');
    setModal(null);
    load();
  };

  const handleToggle = async (id) => {
    await fetch(`${SERVER_URL}/api/barbers/${id}/toggle`, { method: 'PATCH', headers: authHeaders() });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu stilist pasifleştirilecek. Yaklaşan randevuları varsa geri alınamaz. Devam edilsin mi?')) return;
    const res = await fetch(`${SERVER_URL}/api/barbers/${id}`, { method: 'DELETE', headers: authHeaders() });
    const d = await res.json();
    if (!res.ok) { alert(d.error || 'Stilist silinemiyor'); return; }
    load();
  };

  const STATUS_DOT = { active: 'bg-green-500', break: 'bg-amber-500', off: 'bg-slate-300' };

  return (
    <div className="space-y-6">
      {modal !== null && (
        <StylistModal
          stylist={typeof modal === 'object' ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Stilistler</h2>
          <p className="text-on-surface-variant mt-1">{stylists.filter(s => s.isActive).length} aktif ekip üyesi</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">person_add</span>
          Stilist Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylists.map(s => (
            <div key={s.id} className="bg-surface-container-lowest rounded-[2rem] p-6 ambient-shadow group hover:shadow-xl transition-shadow relative overflow-hidden">
              {/* Photo + status dot */}
              <div className="relative w-20 h-20 mb-4">
                {s.photoUrl ? (
                  <img
                    src={`${SERVER_URL}${s.photoUrl}`}
                    alt={s.name}
                    className="w-20 h-20 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-secondary-container flex items-center justify-center text-2xl font-extrabold text-primary">
                    {(s.name || '?')[0].toUpperCase()}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-surface-container-lowest ${s.isActive ? STATUS_DOT.active : STATUS_DOT.off}`} />
              </div>

              {/* Info */}
              <div className="flex items-start justify-between mb-1">
                <p className="font-extrabold text-on-surface">{s.name || s.username}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${LEVEL_STYLE[s.level] || LEVEL_STYLE.SENIOR}`}>
                  {LEVEL_LABELS[s.level] || s.level || 'Kıdemli'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-1">{s.speciality || '@' + s.username}</p>
              <p className="text-xs text-on-surface-variant mb-4">{s.isActive ? '🟢 Aktif' : '🔴 Pasif'}</p>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Telefon</p>
                  <p className="text-xs font-semibold text-on-surface mt-0.5">{s.phone || '—'}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Kullanıcı Adı</p>
                  <p className="text-xs font-semibold text-on-surface mt-0.5">@{s.username}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => setModal(s)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold rounded-xl transition-colors">
                  Düzenle
                </button>
                <button onClick={() => handleToggle(s.id)} className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-primary text-xs font-bold rounded-xl transition-colors">
                  {s.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                </button>
                <button onClick={() => handleDelete(s.id)} className="py-2 px-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => setModal('add')}
            className="border-2 border-dashed border-outline-variant rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 hover:border-primary transition-colors min-h-[200px] text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-4xl">person_add</span>
            <p className="font-semibold text-sm">Yeni Stilist Ekle</p>
          </button>
        </div>
      )}
    </div>
  );
}
