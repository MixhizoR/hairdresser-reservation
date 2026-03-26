import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

const STATUS_STYLE = {
  pending: 'status-pending',
  approved: 'status-confirmed',
  completed: 'status-completed',
  rejected: 'status-rejected',
};

export default function BarberPanel({ token, currentUser, authHeaders, onLogout, audioEnabled, toggleAudio, playSynth }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [prevPending, setPrevPending] = useState(0);

  const fetchAppts = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/appointments`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const newPending = list.filter(a => a.status === 'pending').length;
      if (newPending > prevPending && prevPending !== 0 && audioEnabled) playSynth();
      setPrevPending(newPending);
      setAppointments(list);
      setLoading(false);
    } catch { setLoading(false); }
  }, [token, audioEnabled]);

  /* Poll every 15 seconds */
  useEffect(() => {
    fetchAppts();
    const id = setInterval(fetchAppts, 15000);
    return () => clearInterval(id);
  }, [fetchAppts]);

  const updateStatus = async (id, status) => {
    setActionId(id);
    try {
      await fetch(`${SERVER_URL}/api/appointments/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      await fetchAppts();
    } finally { setActionId(null); }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const pending = appointments.filter(a => a.status === 'pending');
  const upcoming = appointments.filter(a => a.status === 'approved' && new Date(a.time) >= new Date());
  const past = appointments.filter(a => a.status === 'completed' || (a.status === 'approved' && new Date(a.time) < new Date()));

  function AppointmentCard({ appt, showActions }) {
    const timeStr = new Date(appt.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date(appt.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <div className="bg-surface-container-lowest rounded-[2rem] p-5 ambient-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-on-primary rounded-xl px-3 py-1.5 text-center shrink-0">
              <p className="text-lg font-extrabold leading-none">{timeStr}</p>
              <p className="text-[10px] text-on-primary/70">{dateStr}</p>
            </div>
            <div>
              <p className="font-extrabold text-on-surface">{appt.name}</p>
              <p className="text-xs text-on-surface-variant">{appt.phone}</p>
            </div>
          </div>
          <span className={STATUS_STYLE[appt.status]}>{appt.status}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
          <span className="material-symbols-outlined text-base">content_cut</span>
          <span>{appt.service}</span>
        </div>
        {showActions && appt.status === 'pending' && (
          <div className="flex gap-3">
            <button
              disabled={actionId === appt.id}
              onClick={() => updateStatus(appt.id, 'approved')}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">check</span> Approve
            </button>
            <button
              disabled={actionId === appt.id}
              onClick={() => updateStatus(appt.id, 'rejected')}
              className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">close</span> Reject
            </button>
          </div>
        )}
        {showActions && appt.status === 'approved' && (
          <button
            disabled={actionId === appt.id}
            onClick={() => updateStatus(appt.id, 'completed')}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary-dim transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">done_all</span> Mark Completed
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
            {(currentUser?.name || currentUser?.username || 'B')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-extrabold text-on-surface text-sm">{currentUser?.name || currentUser?.username}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Barber Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className={`p-2.5 rounded-full transition-colors ${audioEnabled ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
            title={audioEnabled ? 'Sound on' : 'Sound off'}
          >
            <span className="material-symbols-outlined text-base">{audioEnabled ? 'volume_up' : 'volume_off'}</span>
          </button>
          <button onClick={onLogout} className="p-2.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-red-50 hover:text-error transition-colors">
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{today}</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-extrabold text-on-surface">Pending Approval</h2>
                  <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{pending.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {pending.map(a => <AppointmentCard key={a.id} appt={a} showActions={true} />)}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-extrabold text-on-surface mb-3">Today's Schedule</h2>
                <div className="flex flex-col gap-3">
                  {upcoming.map(a => <AppointmentCard key={a.id} appt={a} showActions={true} />)}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <h2 className="font-extrabold text-on-surface mb-3 text-on-surface-variant">Completed</h2>
                <div className="flex flex-col gap-3">
                  {past.slice(0, 5).map(a => <AppointmentCard key={a.id} appt={a} showActions={false} />)}
                </div>
              </section>
            )}

            {appointments.length === 0 && (
              <div className="text-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">event_available</span>
                <p className="font-semibold">No appointments yet</p>
                <p className="text-sm mt-1">New bookings will appear here</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
