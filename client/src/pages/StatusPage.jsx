import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Calendar, Check, Loader, AlertTriangle } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_API_URL || '';

export default function StatusPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [manualCode, setManualCode] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const socketRef = useRef(null);

    const fetchStatus = async (codeOverride) => {
        setLoading(true);
        setError('');
        try {
            const code = codeOverride || searchParams.get('code');
            const deviceToken = localStorage.getItem('deviceToken');

            let url = `${SERVER_URL}/api/appointments/track`;
            if (code) {
                url += `?code=${code}`;
            } else if (deviceToken) {
                url += `?deviceToken=${deviceToken}`;
            } else {
                setLoading(false);
                return;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
                if (data.length === 0 && code) {
                    setError('Eşleşen randevu bulunamadı.');
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Randevu bilgisi alınamadı.');
            }
        } catch (err) {
            setError('Sunucu bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Socket.io initialization
        socketRef.current = io(SERVER_URL);
        const socket = socketRef.current;

        socket.on('appointment_updated', (updatedAppt) => {
            setAppointments(prev => prev.map(appt => 
                appt.id === updatedAppt.id ? { ...appt, status: updatedAppt.status } : appt
            ));
        });

        socket.on('appointment_deleted', ({ id }) => {
            setAppointments(prev => prev.filter(appt => appt.id !== id));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [searchParams]);

    const handleManualSearch = (e) => {
        e.preventDefault();
        if (manualCode.length !== 6) {
            setError('Takip kodu 6 karakter olmalıdır.');
            return;
        }
        setSearchParams({ code: manualCode.toUpperCase() });
    };

    if (loading && appointments.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--primary)' }}>
                <Loader className="spin" size={40} />
                <span style={{ marginLeft: '1rem' }}>Yükleniyor...</span>
            </div>
        );
    }

    const translateStatus = (status) => {
        const map = {
            'pending': 'BEKLEMEDE',
            'approved': 'ONAYLANDI',
            'rejected': 'REDDEDİLDİ',
            'completed': 'TAMAMLANDI'
        };
        return map[status] || status;
    };

    return (
        <section style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2.5rem' }}>
                <h2 className="gold-text" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Randevu Takip</h2>
                
                <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Takip Kodu (Örn: K9X-B22)"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="form-input"
                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}
                    />
                    <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.8rem 1.5rem' }}>
                        SORGULA
                    </button>
                </form>

                {error && (
                    <div style={{ color: 'var(--accent-red)', textAlign: 'center', marginBottom: '1rem', padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
                        <AlertTriangle size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        {error}
                    </div>
                )}

                {appointments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {appointments.map(appt => (
                            <div key={appt.id} style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{appt.service}</h3>
                                        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>{appt.name}</p>
                                    </div>
                                    <span style={{
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        background: appt.status === 'approved' ? 'rgba(0,255,100,0.1)' : appt.status === 'rejected' ? 'rgba(255,0,0,0.1)' : 'rgba(255,200,0,0.1)',
                                        color: appt.status === 'approved' ? '#00ff66' : appt.status === 'rejected' ? '#ff4444' : '#ffcc00'
                                    }}>
                                        {translateStatus(appt.status)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Tarih & Saat</span>
                                        <span style={{ color: '#fff' }}>{new Date(appt.time).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Berber</span>
                                        <span style={{ color: '#fff' }}>{appt.barberName}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && (
                        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                            <p>Aktif bir randevunuz bulunmuyor.</p>
                        </div>
                    )
                )}
            </motion.div>
        </section>
    );
}