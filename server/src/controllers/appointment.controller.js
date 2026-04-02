const crypto = require('crypto');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { isValidPhone, isValidName } = require('../utils/validators');

// Get availability - supports optional barberId parameter
const getAvailability = async (req, res) => {
    const { barberId } = req.query;

    try {
        // Auto-reject past pending appointments
        await db.rejectPastPending();

        let appointments;
        if (barberId) {
            // Get appointments for specific barber
            appointments = await db.getAppointments({ barberId });
        } else {
            // Get all appointments
            appointments = await db.getAppointments();
        }

        res.json(appointments.map(a => ({
            id: a.id,
            time: a.time,
            status: a.status,
            barberId: a.barberId,
            barberName: a.barber?.name
        })));
    } catch (err) {
        log('error', 'GET /api/appointments/availability failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Get all appointments - filtered by user role
const getAppointments = async (req, res) => {
    const { barberId, status, date } = req.query;

    try {
        // Auto-reject past pending appointments
        await db.rejectPastPending();

        const filters = {};

        // If barber, only show their appointments
        if (req.user.role === 'BARBER') {
            filters.barberId = req.user.id;
        } else if (barberId) {
            // Admin can filter by barber
            filters.barberId = barberId;
        }

        // Filter by status
        if (status && status !== 'all') {
            filters.status = status;
        }

        // Filter by date (YYYY-MM-DD)
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            filters.time = {
                gte: startDate,
                lte: endDate
            };
        }

        const appointments = await db.getAppointments(filters);
        res.json(appointments);
    } catch (err) {
        log('error', 'GET /api/appointments failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Create new appointment
const createAppointment = async (req, res) => {
    const { name, phone, service, time, barberId, notes, website } = req.body;

    // Honeypot
    if (website) return res.status(201).json({ id: crypto.randomUUID(), status: 'pending' });

    // Validate service against database
    try {
        const dbService = await db.findServiceByName(service);
        if (!dbService)
            return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' });
    } catch {
        return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' });
    }

    if (!isValidName(name))
        return res.status(400).json({ error: 'Geçersiz isim. Sadece harf kullanın (2-50 karakter).' });

    if (!isValidPhone(phone))
        return res.status(400).json({ error: 'Geçersiz telefon. Format: 05xxxxxxxxx' });

    // Validate barberId
    if (!barberId)
        return res.status(400).json({ error: 'Lütfen bir berber seçin.' });

    const date = new Date(time);
    if (isNaN(date.getTime()))
        return res.status(400).json({ error: 'Geçersiz tarih.' });

    if (date.getMinutes() % 30 !== 0 || date.getSeconds() !== 0)
        return res.status(400).json({ error: 'Geçersiz saat dilimi (00 veya 30 dakika olmalı).' });

    if (date < new Date())
        return res.status(400).json({ error: 'Geçmiş bir saat seçilemez.' });

    // Validate against 24-hour working hours from settings
    try {
        const settingsRows = await db.getAllSettings();
        const settingsMap = {};
        for (const s of settingsRows) {
            try { settingsMap[s.key] = JSON.parse(s.value); } catch { settingsMap[s.key] = s.value; }
        }
        const operatingHours = settingsMap.operatingHours || {};
        const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = DAYS_MAP[date.getDay()];
        const dayConfig = operatingHours[dayOfWeek];

        if (dayConfig) {
            if (dayConfig.closed) {
                return res.status(400).json({ error: 'Seçilen gün kapalıdır.' });
            }
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const slotTime = hours * 60 + minutes;

            const parseTimeStr = (t) => {
                const [h, m] = (t || '08:30').split(':').map(Number);
                return h * 60 + m;
            };

            const HARD_OPEN = 8 * 60 + 30; // 08:30
            const HARD_CLOSE = 19 * 60;   // 19:00
            
            const openMinutes = Math.max(parseTimeStr(dayConfig.open || '08:30'), HARD_OPEN);
            const closeMinutes = Math.min(parseTimeStr(dayConfig.close || '19:00'), HARD_CLOSE);

            if (slotTime < openMinutes || slotTime >= closeMinutes) {
                return res.status(400).json({
                    error: `Seçilen saat çalışma saatleri dışındadır (08:30 - 19:00).`
                });
            }
        }
    } catch (err) {
        // If settings can't be read, allow booking (fallback behavior)
        log('warn', 'Could not validate working hours', { err: err.message });
    }

    try {
        // Check if time slot is available for this specific barber
        if (await db.findAppointmentByTimeForBarber(date, barberId))
            return res.status(400).json({ error: 'Bu saat dilimi seçtiğiniz berber için zaten rezerve edilmiş.' });

        const appt = await db.createAppointment({
            name: name.trim(),
            phone: phone.trim(),
            service: (service || '').trim(),
            time: date,
            barberId: barberId,
            notes: notes ? notes.trim() : null,
            status: 'pending'
        });

        res.status(201).json(appt);
    } catch (err) {
        log('error', 'POST /api/appointments failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Update appointment
const updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status))
        return res.status(400).json({ error: 'Geçersiz durum.' });

    try {
        const appointment = await db.getAppointmentById(id);
        if (!appointment)
            return res.status(404).json({ error: 'Randevu bulunamadı.' });

        // Check authorization
        // Admin can update any appointment
        // Barber can only update their own appointments
        if (req.user.role === 'BARBER' && appointment.barberId !== req.user.id)
            return res.status(403).json({ error: 'Bu randevuyu güncelleme yetkiniz yok.' });

        const updated = await db.updateAppointment(id, { status, notes });

        res.json(updated);
    } catch (err) {
        log('error', 'PATCH /api/appointments/:id failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Delete appointment (admin only)
const deleteAppointment = async (req, res) => {
    const { id } = req.params;

    try {
        const appointment = await db.getAppointmentById(id);
        if (!appointment)
            return res.status(404).json({ error: 'Randevu bulunamadı.' });

        await db.deleteAppointment(id);

        res.json({ success: true, message: 'Randevu silindi.' });
    } catch (err) {
        log('error', 'DELETE /api/appointments/:id failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Get single appointment
const getAppointment = async (req, res) => {
    const { id } = req.params;

    try {
        const appointment = await db.getAppointmentById(id);
        if (!appointment)
            return res.status(404).json({ error: 'Randevu bulunamadı.' });

        // Check authorization
        if (req.user.role === 'BARBER' && appointment.barberId !== req.user.id)
            return res.status(403).json({ error: 'Bu randevuyu görüntüleme yetkiniz yok.' });

        res.json(appointment);
    } catch (err) {
        log('error', 'GET /api/appointments/:id failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Track appointments (Public with strict limiting)
const trackAppointments = async (req, res) => {
    const { code, deviceToken } = req.query;

    if (!code && !deviceToken) {
        return res.status(400).json({ error: 'Lütfen bir takip kodu veya cihaz tokeni sağlayın.' });
    }

    try {
        let appointments = [];

        if (deviceToken) {
            const results = await db.getAppointmentsByDeviceToken(deviceToken);
            appointments = results || [];
        } else if (code) {
            const result = await db.getAppointmentByTrackingCode(code);
            if (result) appointments = [result];
        }

        // Apply strict data masking before sending to client
        const maskedAppointments = appointments.map(appt => {
            const parts = appt.name.split(' ');
            const maskedName = parts.map(p => p.charAt(0) + '***').join(' ');
            
            return {
                id: appt.id,
                name: maskedName,
                service: appt.service,
                time: appt.time,
                status: appt.status,
                barberName: appt.barber?.name || 'Berber',
                createdAt: appt.createdAt
            };
        });

        res.json(maskedAppointments);
    } catch (err) {
        log('error', 'GET /api/appointments/track failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    getAvailability,
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointment,
    trackAppointments
};
