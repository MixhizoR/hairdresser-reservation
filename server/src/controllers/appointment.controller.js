const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { isValidPhone, isValidName } = require('../utils/validators');
const socketModule = require('../socket');

const getAvailability = async (req, res) => {
    try {
        const all = await db.getAppointments();
        res.json(all.map(a => ({ time: a.time, status: a.status })));
    } catch (err) {
        log('error', 'GET /api/appointments/availability failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

const getAppointments = async (req, res) => {
    try {
        res.json(await db.getAppointments());
    } catch (err) {
        log('error', 'GET /api/appointments failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

const createAppointment = async (req, res) => {
    const { name, phone, service, time, website } = req.body;

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

    const date = new Date(time);
    if (isNaN(date.getTime()))
        return res.status(400).json({ error: 'Geçersiz tarih.' });

    if (date.getMinutes() % 30 !== 0 || date.getSeconds() !== 0)
        return res.status(400).json({ error: 'Geçersiz saat dilimi (00 veya 30 dakika olmalı).' });

    if (date < new Date())
        return res.status(400).json({ error: 'Geçmiş bir saat seçilemez.' });

    try {
        if (await db.findAppointmentByTime(date))
            return res.status(400).json({ error: 'Bu saat dilimi zaten rezerve edilmiş.' });

        const appt = await db.createAppointment({
            name: validator.escape(name.trim()),
            phone: phone.trim(),
            service: validator.escape((service || '').trim()),
            time: date,
        });

        const io = socketModule.getIO();
        io.emit('new_appointment', appt);
        res.status(201).json(appt);
    } catch (err) {
        log('error', 'POST /api/appointments failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

const updateAppointment = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status))
        return res.status(400).json({ error: 'Geçersiz durum.' });

    try {
        const updated = await db.updateAppointment(id, status);
        const io = socketModule.getIO();
        io.emit('appointment_updated', { id: updated.id, status: updated.status });
        res.json({ success: true });
    } catch (err) {
        log('error', 'PATCH /api/appointments failed', { id: req.params.id, err: err.message });
        res.status(404).json({ error: 'Randevu bulunamadı.' });
    }
};

module.exports = {
    getAvailability,
    getAppointments,
    createAppointment,
    updateAppointment,
};
