import { useState, useEffect } from 'react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';
const CATEGORIES = ['BARBERING', 'GROOMING', 'TREATMENTS'];

function ServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || '',
    duration: service?.duration || 30,
    category: service?.category || 'BARBERING',
    isActive: service?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration) { setError('Name, price and duration are required.'); return; }
    if (form.duration % 15 !== 0) { setError('Duration must be a multiple of 15 minutes.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({ ...form, price: parseFloat(form.price), duration: parseInt(form.duration) });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-lg ambient-shadow">
        <h3 className="text-xl font-extrabold text-on-surface mb-6">{service ? 'Edit Service' : 'Add New Service'}</h3>

        {error && <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Service Name *</label>
            <input className="input-base" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Classic Cut" />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Description</label>
            <textarea className="input-base resize-none h-20" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Short description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Price (₺) *</label>
              <input type="number" min="0" className="input-base" value={form.price} onChange={e => update('price', e.target.value)} placeholder="250" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Duration (min) *</label>
              <select className="input-base" value={form.duration} onChange={e => update('duration', parseInt(e.target.value))}>
                {[15, 30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Category</label>
            <select className="input-base" value={form.category} onChange={e => update('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => update('isActive', e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="isActive" className="text-sm font-medium text-on-surface">Active (visible to customers)</label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 btn-secondary py-3">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : 'Save Service'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage({ token, authHeaders }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | service object

  const load = () => {
    fetch(`${SERVER_URL}/api/services`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSave = async (data) => {
    const isEdit = modal && typeof modal === 'object';
    const url = isEdit ? `${SERVER_URL}/api/services/${modal.id}` : `${SERVER_URL}/api/services`;
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(data) });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Failed to save');
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this service?')) return;
    await fetch(`${SERVER_URL}/api/services/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  };

  const CAT_COLOR = { BARBERING: 'bg-blue-50 text-blue-700', GROOMING: 'bg-green-50 text-green-700', TREATMENTS: 'bg-purple-50 text-purple-700' };

  return (
    <div className="space-y-6">
      {modal && (
        <ServiceModal
          service={typeof modal === 'object' ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Services</h2>
          <p className="text-on-surface-variant mt-1">{services.filter(s => s.isActive).length} active services</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span>
          Add Service
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">content_cut</span>
            <p className="font-medium">No services yet</p>
            <button onClick={() => setModal('add')} className="btn-primary mt-4 text-sm">Add your first service</button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant">
                <th className="text-left px-6 py-4 font-bold">Service</th>
                <th className="text-left px-6 py-4 font-bold">Category</th>
                <th className="text-left px-6 py-4 font-bold">Price</th>
                <th className="text-left px-6 py-4 font-bold">Duration</th>
                <th className="text-left px-6 py-4 font-bold">Status</th>
                <th className="text-left px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-on-surface">{s.name}</p>
                    <p className="text-xs text-on-surface-variant truncate max-w-xs">{s.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${CAT_COLOR[s.category] || CAT_COLOR.BARBERING}`}>
                      {s.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">₺{s.price}</td>
                  <td className="px-6 py-4 text-sm text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">schedule</span>
                    {s.duration} min
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(s)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-700 transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Deactivate">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
