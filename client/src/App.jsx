import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Calendar, Bell, Check, X, User, Phone, Clock } from 'lucide-react';

const SERVER_URL = `http://${window.location.hostname}:5000`;
const socket = io(SERVER_URL);

function App() {
  const [view, setView] = useState('customer'); // 'customer' or 'admin'
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ name: '', phone: '', service: 'Haircut', time: '' });
  const [isBooked, setIsBooked] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Refs to fix closure issues in socket listener and persist AudioContext
  const audioEnabledRef = useRef(audioEnabled);
  const viewRef = useRef(view);
  const audioCtxRef = useRef(null);

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { viewRef.current = view; }, [view]);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };
  
  // Web Audio API Synthesizer (100% reliable, no external file needed)
  const playNotificationSound = () => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio synth error:", e);
    }
  };

  useEffect(() => {
    socket.on('new_appointment', (appointment) => {
      setAppointments(prev => [appointment, ...prev]);
      if (viewRef.current === 'admin' && audioEnabledRef.current) {
        playNotificationSound();
        console.log("Synthesized notification sound played.");
      }
    });

    socket.on('appointment_updated', ({ id, status }) => {
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    });

    fetch(`${SERVER_URL}/api/appointments`)
      .then(res => res.json())
      .then(data => setAppointments(data.reverse()));

    return () => {
      socket.off('new_appointment');
      socket.off('appointment_updated');
    };
  }, []); // Run once to keep socket listener alive with refs

  const handleBooking = async (e) => {
    e.preventDefault();
    const res = await fetch(`${SERVER_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppointment)
    });
    if (res.ok) {
      setIsBooked(true);
      setNewAppointment({ name: '', phone: '', service: 'Haircut', time: '' });
      setTimeout(() => setIsBooked(false), 3000);
    }
  };

  const updateStatus = async (id, status) => {
    await fetch(`${SERVER_URL}/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  };

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    if (nextState) {
      playNotificationSound(); // Play once to "wake up" the AudioContext
      console.log("Audio system armed with Synthesizer.");
    }
  };

  return (
    <div className="min-h-screen premium-bg text-white">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center glass-panel m-4">
        <div className="flex items-center gap-2">
          <Scissors className="text-[#d4af37]" />
          <h1 className="text-xl font-bold tracking-tighter gold-text">NOIR BARBER</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setView('customer')}
            className={`px-4 py-2 rounded-full transition-all ${view === 'customer' ? 'bg-[#d4af37] text-black' : 'hover:bg-white/10'}`}
          >
            Customer
          </button>
          <button 
            onClick={() => setView('admin')}
            className={`px-4 py-2 rounded-full transition-all ${view === 'admin' ? 'bg-[#d4af37] text-black' : 'hover:bg-white/10'}`}
          >
            Admin Panel
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4 flex justify-center">
        {view === 'customer' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-8 glass-panel"
          >
            <h2 className="text-3xl font-bold mb-6 gold-text">Book Appointment</h2>
            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newAppointment.name}
                  onChange={e => setNewAppointment({...newAppointment, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-[#d4af37]"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Phone</label>
                <input 
                  required
                  type="tel" 
                  value={newAppointment.phone}
                  onChange={e => setNewAppointment({...newAppointment, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-[#d4af37]"
                  placeholder="+90 ..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Service</label>
                <select 
                  value={newAppointment.service}
                  onChange={e => setNewAppointment({...newAppointment, service: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 p-3 rounded-lg focus:outline-none focus:border-[#d4af37] text-white"
                >
                  <option>Haircut</option>
                  <option>Beard Trim</option>
                  <option>Wash & Style</option>
                  <option>Royal Shave</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Time</label>
                <input 
                  required
                  type="datetime-local" 
                  value={newAppointment.time}
                  onChange={e => setNewAppointment({...newAppointment, time: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              
              <button type="submit" className="btn-premium w-full mt-4 flex items-center justify-center gap-2">
                {isBooked ? <Check size={20} /> : <Calendar size={20} />}
                {isBooked ? 'Request Sent!' : 'Request Reservation'}
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold gold-text flex items-center gap-3">
                <Bell className="text-[#d4af37]" />
                Admin Dashboard
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleAudio}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    audioEnabled ? 'bg-[#00f260]/10 border-[#00f260]/50 text-[#00f260]' : 'bg-[#ff4b2b]/10 border-[#ff4b2b]/50 text-[#ff4b2b]'
                  }`}
                >
                  <Bell size={16} />
                  {audioEnabled ? 'Ses Açık' : 'Sesi Aktifleştir!'}
                </button>
                <div className="text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  Live Monitoring Active
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <AnimatePresence>
                {appointments.map((app) => (
                  <motion.div 
                    key={app.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`glass-panel p-6 flex items-center justify-between border-l-4 ${
                      app.status === 'pending' ? 'border-[#ff4b2b] pending-alert' : 
                      app.status === 'approved' ? 'border-[#00f260]' : 'border-gray-600'
                    }`}
                  >
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <User className="text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{app.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Phone size={14} /> {app.phone}</span>
                          <span className="flex items-center gap-1"><Scissors size={14} /> {app.service}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> 
                            {app.time && !isNaN(new Date(app.time).getTime()) 
                              ? new Date(app.time).toLocaleString() 
                              : 'Time not set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updateStatus(app.id, 'approved')}
                            className="bg-[#00f260]/10 hover:bg-[#00f260]/20 text-[#00f260] p-3 rounded-lg border border-[#00f260]/20 transition-all"
                            title="Approve"
                          >
                            <Check size={24} />
                          </button>
                          <button 
                              onClick={() => updateStatus(app.id, 'rejected')}
                            className="bg-[#ff4b2b]/10 hover:bg-[#ff4b2b]/20 text-[#ff4b2b] p-3 rounded-lg border border-[#ff4b2b]/20 transition-all"
                            title="Reject"
                          >
                            <X size={24} />
                          </button>
                        </>
                      )}
                      {app.status !== 'pending' && (
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${
                          app.status === 'approved' ? 'bg-[#00f260]/20 text-[#00f260]' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {app.status}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {appointments.length === 0 && (
                <div className="text-center py-20 text-gray-500 glass-panel">
                  No appointments found yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
