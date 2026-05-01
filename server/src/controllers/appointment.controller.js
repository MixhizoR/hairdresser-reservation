const crypto = require('crypto');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { isValidPhone, isValidName, sanitizePhone } = require('../utils/validators');

// Helper to convert to Turkey time (UTC+3, no DST)
const toTurkeyTime = (date) => {
    const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;
    return new Date(date.getTime() + TURKEY_OFFSET_MS);
};

// Get availability - supports optional barberId parameter
const getAvailability = async (req, res) => {
    const { barberId, month, year } = req.query;

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

        // Calculate fully booked days
        const fullyBookedDays = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate max date (14 days from today as per booking limit)
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 14);

        // Determine date range to check (default to current month if not specified)
        const checkMonth = month ? parseInt(month) : today.getMonth();
        const checkYear = year ? parseInt(year) : today.getFullYear();
        const daysInMonth = new Date(checkYear, checkMonth + 1, 0).getDate();

        // Hardcoded operating hours: 08:00-21:00, Sunday closed
        const OPEN_HOUR = 8;
        const CLOSE_HOUR = 21;
        const SLOTS_PER_DAY = (CLOSE_HOUR - OPEN_HOUR) * 2; // 30-min slots: 26 slots

        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(checkYear, checkMonth, day);
            const dayOfWeek = checkDate.getDay(); // 0 = Sunday
            const dateStr = `${checkYear}-${String(checkMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Skip if beyond 14-day limit
            if (checkDate > maxDate) {
                fullyBookedDays.push(dateStr);
                continue;
            }

            // Sunday is closed
            if (dayOfWeek === 0) {
                fullyBookedDays.push(dateStr);
                continue;
            }

            // For today, check if all remaining slots are taken
            const isToday = checkDate.getTime() === today.getTime();
            const currentHour = new Date().getHours();
            const currentMinute = new Date().getMinutes();
            const currentSlot = isToday ? (currentHour - OPEN_HOUR) * 2 + (currentMinute >= 30 ? 1 : 0) : 0;
            const availableSlotsForToday = isToday ? Math.max(0, SLOTS_PER_DAY - currentSlot) : SLOTS_PER_DAY;

            // Count slots taken on this day by all barbers (non-rejected appointments)
            const dayAppointments = appointments.filter(a => {
                const aDate = new Date(a.time);
                return aDate.getFullYear() === checkYear &&
                       aDate.getMonth() === checkMonth &&
                       aDate.getDate() === day &&
                       a.status !== 'rejected';
            });

            // Calculate slots taken (accounting for duration)
            let slotsTaken = 0;
            for (const appt of dayAppointments) {
                const serviceDuration = appt.serviceRef?.duration || 30;
                const slotsNeeded = Math.ceil(serviceDuration / 30);
                slotsTaken += slotsNeeded;
            }

            // Day is fully booked if all available slots are taken
            if (slotsTaken >= availableSlotsForToday) {
                fullyBookedDays.push(dateStr);
            }
        }

        res.json({
            appointments: appointments.map(a => ({
                time: a.time,
                status: a.status,
                barberId: a.barberId,
                barberName: a.barber?.name
            })),
            fullyBookedDays
        });
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
    const { name, phone, service, time, barberId, notes, website, customDuration } = req.body;

    // Type checks for string fields
    if (typeof name !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: name' });
    if (typeof phone !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: phone' });
    if (typeof service !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: service' });
    if (notes && typeof notes !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: notes' });

    // Honeypot
    if (website) return res.status(201).json({ id: crypto.randomUUID(), status: 'pending' });

    // Validate service against database and get duration
    let serviceDuration = 30; // default duration in minutes
    try {
        const dbService = await db.findServiceByName(service);
        if (!dbService)
            return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' });
        serviceDuration = dbService.duration || 30;
    } catch {
        return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' });
    }

    if (!isValidName(name))
        return res.status(400).json({ error: 'Geçersiz isim. Sadece harf kullanın (2-50 karakter).' });

    // Sanitize phone before validation
    const sanitizedPhone = sanitizePhone(phone);
    if (!isValidPhone(sanitizedPhone))
        return res.status(400).json({ error: 'Geçersiz telefon. Format: 05xxxxxxxxx' });

    // Validate barberId
    if (!barberId)
        return res.status(400).json({ error: 'Lütfen bir berber seçin.' });

    const date = new Date(time);
    if (isNaN(date.getTime()))
        return res.status(400).json({ error: 'Geçersiz tarih.' });

    const localDate = toTurkeyTime(date);
    if (localDate.getUTCMinutes() % 30 !== 0 || localDate.getUTCSeconds() !== 0)
        return res.status(400).json({ error: 'Geçersiz saat dilimi (00 veya 30 dakika olmalı).' });

    if (date < new Date())
        return res.status(400).json({ error: 'Geçmiş bir saat seçilemez.' });

    // Validate 14-day advance booking limit
    const MAX_ADVANCE_DAYS = 14;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
    if (date > maxDate)
        return res.status(400).json({ error: 'En fazla 14 gün sonrasına randevu alabilirsiniz.' });

    // Validate against hardcoded working hours (08:00-21:00, Sunday closed)
    const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = DAYS_MAP[localDate.getUTCDay()];

    // Sunday is closed
    if (dayOfWeek === 'sunday') {
        return res.status(400).json({ error: 'Seçilen gün kapalıdır.' });
    }

    const slotTime = localDate.getUTCHours() * 60 + localDate.getUTCMinutes();
    const OPEN_MINUTES = 8 * 60; // 08:00
    const CLOSE_MINUTES = 21 * 60; // 21:00

    // Check if start time is before opening
    if (slotTime < OPEN_MINUTES) {
        return res.status(400).json({ error: 'Hizmet süresi mesai saatleri dışındadır.' });
    }

    // Check if appointment end time exceeds closing time
    if (slotTime + serviceDuration > CLOSE_MINUTES) {
        return res.status(400).json({ error: 'Hizmet süresi mesai saatleri dışındadır.' });
    }

    try {
        // Check if time slot is available for this specific barber
        if (await db.findAppointmentByTimeForBarber(date, barberId))
            return res.status(400).json({ error: 'Bu saat dilimi seçtiğiniz berber için zaten rezerve edilmiş.' });

        // Determine effective duration and status
        const isAuthorized = req.user && (req.user.role === 'ADMIN' || req.user.role === 'BARBER');
        let appointmentStatus = 'pending';
        if (name === 'MOLA') {
            appointmentStatus = 'approved';
        }
        const createData = {
            name: name.trim(),
            phone: sanitizedPhone,
            service: (service || '').trim(),
            time: date,
            barberId: barberId,
            notes: notes ? notes.trim() : null,
            status: appointmentStatus
        };
        if (isAuthorized && customDuration) {
            createData.customDuration = parseInt(customDuration);
        }

        const appt = await db.createAppointment(createData);

        res.status(201).json(appt);
    } catch (err) {
        if (err.code === 'TIME_SLOT_TAKEN') {
            return res.status(400).json({ error: 'Bu saat dilimi seçtiğiniz berber için zaten rezerve edilmiş.' });
        }
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

    if (notes !== undefined && typeof notes !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: notes' });

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

// Cancel appointment via tracking code (customer self-service)
const cancelAppointment = async (req, res) => {
    const { trackingCode } = req.body;

    if (!trackingCode) {
        return res.status(400).json({ error: 'Takip kodu gereklidir.' });
    }

    try {
        const appointment = await db.getAppointmentByTrackingCode(trackingCode);

        if (!appointment) {
            return res.status(404).json({ error: 'Randevu bulunamadı.' });
        }

        // Only allow cancellation of pending appointments
        if (appointment.status === 'approved') {
            return res.status(400).json({
                error: 'Onaylanmış randevu sadece berber tarafından iptal edilebilir.'
            });
        }

        // Already rejected/cancelled is idempotent success
        if (appointment.status === 'rejected') {
            return res.json({
                success: true,
                message: 'Randevu zaten iptal edilmiş.',
                appointment: {
                    id: appointment.id,
                    status: 'rejected'
                }
            });
        }

        // Cancel (reject) the pending appointment
        const updated = await db.updateAppointment(appointment.id, { status: 'rejected' });

        res.json({
            success: true,
            message: 'Randevu başarıyla iptal edildi.',
            appointment: {
                id: updated.id,
                status: updated.status
            }
        });
    } catch (err) {
        log('error', 'POST /api/appointments/cancel failed', { err: err.message });
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
    trackAppointments,
    cancelAppointment
};
