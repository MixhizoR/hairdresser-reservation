const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { isValidPhone, isValidName } = require('../utils/validators');
const socketModule = require('../socket');

// Get availability - supports optional barberId parameter
const getAvailability = async (req, res) => {
    const { barberId } = req.query;

    try {
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
    if (website) return res.status(201).json({ id: uuidv4(), status: 'pending' });

    const allowedServices = [
        'Saç Kesimi', 'Sakal Kesimi', 'Saç & Sakal Kesimi', 'Çocuk Tıraşı',
        'Cilt Bakımı', 'Kaş Alımı', 'Fön', 'Ağda', 'Damat Tıraşı', 'Ev Tıraşı'
    ];
    if (!allowedServices.includes(service))
        return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' });

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

    try {
        // Check if time slot is available for this specific barber
        if (await db.findAppointmentByTimeForBarber(date, barberId))
            return res.status(400).json({ error: 'Bu saat dilimi seçtiğiniz berber için zaten rezerve edilmiş.' });

        const appt = await db.createAppointment({
            name: validator.escape(name.trim()),
            phone: phone.trim(),
            service: validator.escape((service || '').trim()),
            time: date,
            barberId: barberId,
            notes: notes ? validator.escape(notes.trim()) : null,
            status: 'pending'
        });

        const io = socketModule.getIO();
        io.emit('new_appointment', appt);
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

    if (!['approved', 'rejected', 'pending', 'completed'].includes(status))
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

        const io = socketModule.getIO();
        io.emit('appointment_updated', updated);

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

        const io = socketModule.getIO();
        io.emit('appointment_deleted', { id });

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

module.exports = {
    getAvailability,
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointment
};
