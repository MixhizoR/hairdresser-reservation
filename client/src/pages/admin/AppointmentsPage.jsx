import React, { useState, useEffect, useCallback } from "react";

const SERVER_URL = import.meta.env.VITE_API_URL || "";
const FILTERS = ["all", "pending", "approved", "rejected"];
const FILTER_LABELS = {
  all: "Tümü",
  pending: "Bekleyen",
  approved: "Onaylanan",
  rejected: "Reddedilen",
};

const STATUS_STYLE = {
  pending: "status-pending",
  approved: "status-confirmed",
  rejected: "status-rejected",
};

const STATUS_LABELS = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

function BreakModal({ onClose, onSave, currentUser, appointments }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    startHour: "12",
    startMinute: "00",
    endHour: "13",
    endMinute: "00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(
    currentUser?.id || "",
  );

  // Fetch barbers if admin
  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetch(`${SERVER_URL}/api/barbers`)
        .then((r) => r.json())
        .then((data) => setBarbers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [currentUser]);

  const HOURS = Array.from({ length: 13 }, (_, i) => String(i + 8).padStart(2, "0")); // 08-20
  const MINUTES = ["00", "30"];

  const calculateDuration = () => {
    const startMinutes = parseInt(form.startHour) * 60 + parseInt(form.startMinute);
    const endMinutes = parseInt(form.endHour) * 60 + parseInt(form.endMinute);
    if (endMinutes <= startMinutes) {
      return null; // invalid
    }
    return endMinutes - startMinutes;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const duration = calculateDuration();
    if (duration === null) {
      setError("Bitiş saati başlangıç saatinden sonra olmalıdır.");
      setLoading(false);
      return;
    }

    const startTime = new Date(`${form.date}T${form.startHour}:${form.startMinute}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Client-side overlap check
    const barberId = selectedBarberId || currentUser?.id;
    const hasOverlap = appointments.some(a => {
      if (a.barberId !== barberId || a.status === 'rejected') return false;
      const aStart = new Date(a.time);
      const aDuration = a.customDuration || 30; // simplified, real check might need service duration
      const aEnd = new Date(aStart.getTime() + aDuration * 60000);
      return (aStart < endTime && aEnd > startTime);
    });

    if (hasOverlap) {
      setError("Seçilen saat aralığında mevcut randevu bulunmaktadır.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: "MOLA",
        phone: "",
        service: "MOLA",
        time: startTime.toISOString(),
        customDuration: duration,
        barberId: barberId,
        status: "approved",
        notes: "Mola / Break"
      };
      await onSave(payload);
    } catch (e) {
      const msg = e.message || "";
      if (
        msg.includes("TIME_SLOT_TAKEN") ||
        msg.includes("çakışma") ||
        msg.includes("rezerve")
      ) {
        setError(
          "Seçilen saat aralığında çakışma mevcut, lütfen boş bir saat seçin.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface-container-lowest rounded-[2rem] p-8 w-full max-w-sm ambient-shadow">
        <h3 className="text-xl font-extrabold text-on-surface mb-6">
          Mola / İzin Ekle
        </h3>
        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="break-date"
              className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block"
            >
              Tarih
            </label>
            <input
              id="break-date"
              type="date"
              className="input-base"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Başlangıç</label>
              <div className="flex gap-1">
                <select aria-label="Başlangıç Saati" className="input-base px-2" value={form.startHour} onChange={e => setForm({...form, startHour: e.target.value})}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select aria-label="Başlangıç Dakikası" className="input-base px-2" value={form.startMinute} onChange={e => setForm({...form, startMinute: e.target.value})}>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Bitiş</label>
              <div className="flex gap-1">
                <select aria-label="Bitiş Saati" className="input-base px-2" value={form.endHour} onChange={e => setForm({...form, endHour: e.target.value})}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select aria-label="Bitiş Dakikası" className="input-base px-2" value={form.endMinute} onChange={e => setForm({...form, endMinute: e.target.value})}>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Barber selection for admin */}
          {currentUser?.role === "ADMIN" && (
            <div>
              <label
                htmlFor="break-barber"
                className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block"
              >
                Berber Seçin
              </label>
              <select
                id="break-barber"
                className="input-base"
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
              >
                <option value="">Berber Seçin</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-surface-container rounded-xl p-3 text-sm text-on-surface-variant">
            Süre:{" "}
            <span className="font-bold text-on-surface">
              {calculateDuration() || "-"}
            </span>{" "}
            dakika
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 btn-secondary py-3">
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 btn-primary py-3 flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              "Saatleri Kapat"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Polling: fetch every 15 seconds ── */
function useAppointmentsPolling(token, authHeadersFn) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevPendingCount, setPrevPendingCount] = useState(0);

  const fetch_ = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `${SERVER_URL}/api/appointments?fromDate=${todayStr}`,
        { headers: authHeadersFn() },
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const newPending = list.filter((a) => a.status === "pending").length;
      if (newPending > prevPendingCount && prevPendingCount !== 0) {
        window.dispatchEvent(new CustomEvent("new-pending"));
      }
      setPrevPendingCount(newPending);
      setAppointments(list);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 15000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { appointments, loading, refresh: fetch_ };
}

export default function AppointmentsPage({
  token,
  authHeaders,
  currentUser,
  audioEnabled,
  playSynth,
}) {
  const { appointments, loading, refresh } = useAppointmentsPolling(
    token,
    authHeaders,
  );
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [showBreakModal, setShowBreakModal] = useState(false);

  /* Play sound on new pending */
  useEffect(() => {
    const handler = () => {
      if (audioEnabled) playSynth();
    };
    window.addEventListener("new-pending", handler);
    return () => window.removeEventListener("new-pending", handler);
  }, [audioEnabled]);

  const updateStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) await refresh();
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAppointment = async (id) => {
    if (!confirm("Bu randevuyu silmek istiyor musunuz?")) return;
    setActionLoading(id + "del");
    try {
      await fetch(`${SERVER_URL}/api/appointments/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      await refresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveBreak = async (payload) => {
    const res = await fetch(`${SERVER_URL}/api/appointments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Randevu oluşturulamadı");
    }
    setShowBreakModal(false);
    refresh();
  };

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);
  const pendingCount = appointments.filter(
    (a) => a.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Randevular
          </h2>
          <p className="text-on-surface-variant mt-1">
            {pendingCount > 0 && (
              <span className="text-amber-600 font-semibold">
                {pendingCount} onay bekliyor ·{" "}
              </span>
            )}
            {appointments.length} toplam
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowBreakModal(true)}
            className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">block</span>{" "}
            Mola Ekle
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">refresh</span>{" "}
            Yenile
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {FILTER_LABELS[f] || f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-white rounded-full text-[10px] px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-30">
              event_busy
            </span>
            <p className="font-medium">Henüz randevu yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-widest text-on-surface-variant">
                  <th
                    className="text-left px-6 py-4 font-bold whitespace-nowrap"
                    style={{ width: "15%" }}
                  >
                    Saat
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold whitespace-nowrap"
                    style={{ width: "20%" }}
                  >
                    Müşteri
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold whitespace-nowrap hidden md:table-cell"
                    style={{ width: "18%" }}
                  >
                    Stilist
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold whitespace-nowrap hidden md:table-cell"
                    style={{ width: "17%" }}
                  >
                    Hizmet
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold whitespace-nowrap"
                    style={{ width: "12%" }}
                  >
                    Durum
                  </th>
                  <th
                    className="text-left px-6 py-4 font-bold whitespace-nowrap"
                    style={{ width: "18%" }}
                  >
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-surface-container hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <p className="font-bold text-sm text-on-surface">
                        {new Date(a.time).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(a.time).toLocaleDateString("tr-TR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <p className="font-semibold text-sm text-on-surface overflow-hidden text-ellipsis">
                        {a.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {a.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(a.barber?.name || "?")[0]}
                        </div>
                        <span className="text-sm text-on-surface">
                          {a.barber?.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface whitespace-nowrap min-w-0 hidden md:table-cell overflow-hidden text-ellipsis">
                      {a.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <span
                        className={
                          STATUS_STYLE[a.status] || STATUS_STYLE.pending
                        }
                      >
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-0">
                      <div className="flex items-center gap-1">
                        {a.status === "pending" && (
                          <>
                            <button
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(a.id, "approved")}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                              title="Onayla"
                            >
                              <span className="material-symbols-outlined text-base">
                                check
                              </span>
                            </button>
                            <button
                              disabled={!!actionLoading}
                              onClick={() => updateStatus(a.id, "rejected")}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                              title="Reddet"
                            >
                              <span className="material-symbols-outlined text-base">
                                close
                              </span>
                            </button>
                          </>
                        )}
                        <button
                          disabled={!!actionLoading}
                          onClick={() => deleteAppointment(a.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="Sil"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showBreakModal && (
        <BreakModal
          onClose={() => setShowBreakModal(false)}
          onSave={handleSaveBreak}
          currentUser={currentUser}
          appointments={appointments}
        />
      )}
    </div>
  );
}
