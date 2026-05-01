const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

// Note: Operating hours are now hardcoded to 08:00-21:00, Monday-Saturday
// Sunday is always closed. No DB settings are fetched for validation.

jest.mock('../../src/middlewares/rateLimit.middleware', () => {
    const noop = (req, res, next) => next();
    return {
        generalLimiter: noop,
        loginLimiter: noop,
        appointmentLimiter: noop,
        trackLimiter: noop,
        cancelLimiter: noop,
    };
});

describe('Booking Validation - Working Hours', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        dbService.findServiceByName.mockResolvedValue({ id: 'svc-1', name: 'Saç Kesimi', isActive: true });
        dbService.findAppointmentByTimeForBarber.mockResolvedValue(null);
        dbService.createAppointment.mockImplementation(async (data) => ({
            id: 'appt-new',
            ...data,
            deviceToken: 'uuid-1',
            trackingCode: 'ABC123'
        }));
    });

    const getFutureDateTime = (dayOffset, hours, minutes) => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        date.setHours(hours, minutes, 0, 0);
        // Ensure it's in the future
        if (date < new Date()) date.setDate(date.getDate() + 7);
        return date;
    };

    const getNextMondayAt = (hours, minutes) => {
        const date = new Date();
        const dayOfWeek = date.getDay(); // 0=Sun
        const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
        date.setDate(date.getDate() + daysUntilMonday);
        date.setHours(hours, minutes, 0, 0);
        if (date < new Date()) date.setDate(date.getDate() + 7);
        return date;
    };

    // Hardcoded hours: 08:00-21:00, Sunday closed
    // No need for dynamic operating hours anymore

    // ==================== ALLOWED BOOKINGS ====================

    describe('Allow booking during hardcoded working hours (08:00-21:00)', () => {
        it('should allow booking at hardcoded opening time (08:00)', async () => {
            const monday8am = getNextMondayAt(8, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday8am.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
            expect(dbService.createAppointment).toHaveBeenCalled();
        });

        it('should allow booking at 30-min slot (14:30)', async () => {
            const monday1430 = getNextMondayAt(14, 30);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday1430.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
        });

        it('should allow booking at last valid slot (20:30 for 21:00 close)', async () => {
            const monday2030 = getNextMondayAt(20, 30);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday2030.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
        });

        it('should allow booking on Saturday (uses same hours 08:00-21:00)', async () => {
            const date = new Date();
            // Find next Saturday
            const daysUntilSat = (6 - date.getDay() + 7) % 7 || 7;
            date.setDate(date.getDate() + daysUntilSat);
            date.setHours(12, 0, 0, 0);
            if (date < new Date()) date.setDate(date.getDate() + 7);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: date.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
        });
    });

    // ==================== REJECTED BOOKINGS ====================

    describe('Reject booking outside hardcoded working hours (08:00-21:00)', () => {
        it('should reject booking before 08:00 opening time', async () => {
            const monday7am = getNextMondayAt(7, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday7am.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/mesai saatleri dışındadır/i);
        });

        it('should reject booking at closing time (21:00)', async () => {
            const monday9pm = getNextMondayAt(21, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday9pm.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/mesai saatleri dışındadır/i);
        });

        it('should reject booking after closing time (22:00)', async () => {
            const monday10pm = getNextMondayAt(22, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday10pm.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/mesai saatleri dışındadır/i);
        });

        it('should reject booking with proper error message for outside hours', async () => {
            const monday7am = getNextMondayAt(7, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday7am.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Hizmet süresi mesai saatleri dışındadır.');
        });
    });

    // ==================== CLOSED DAY ====================

    describe('Reject booking on Sunday (always closed)', () => {
        it('should reject booking on Sunday', async () => {
            const date = new Date();
            const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
            date.setDate(date.getDate() + daysUntilSunday);
            date.setHours(10, 0, 0, 0);
            if (date < new Date()) date.setDate(date.getDate() + 7);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: date.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Seçilen gün kapalıdır.');
        });

        it('should allow booking on Monday-Saturday (all use 08:00-21:00)', async () => {
            // Test Monday (day 1)
            const monday10am = getNextMondayAt(10, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday10am.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
        });
    });

    // ==================== SERVICE DURATION VALIDATION ====================

    describe('Reject booking when service duration exceeds 21:00 closing time', () => {
        it('should reject 60-min service starting 30 mins before 21:00 closing', async () => {
            // 60-minute service starting at 20:30 would end at 21:30 > 21:00
            dbService.findServiceByName.mockResolvedValue({ id: 'svc-long', name: 'Özel Bakım', duration: 60, isActive: true });

            const monday2030 = getNextMondayAt(20, 30);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Özel Bakım',
                    time: monday2030.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Hizmet süresi mesai saatleri dışındadır.');
        });

        it('should allow service ending exactly at 21:00 closing time', async () => {
            // 60-minute service starting at 20:00 ends at 21:00 == 21:00
            dbService.findServiceByName.mockResolvedValue({ id: 'svc-long', name: 'Özel Bakım', duration: 60, isActive: true });
            dbService.findAppointmentByTimeForBarber.mockResolvedValue(null);

            const monday2000 = getNextMondayAt(20, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Özel Bakım',
                    time: monday2000.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
            expect(dbService.createAppointment).toHaveBeenCalled();
        });

        it('should reject service ending 1 minute after 21:00 closing time', async () => {
            // 31-minute service starting at 20:30 ends at 21:01 > 21:00
            dbService.findServiceByName.mockResolvedValue({ id: 'svc-short', name: 'Saç Kesimi', duration: 31, isActive: true });

            const monday2030 = getNextMondayAt(20, 30);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday2030.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Hizmet süresi mesai saatleri dışındadır.');
        });
    });

    // ==================== NO DB FALLBACK NEEDED ====================
    // Note: Since operating hours are now hardcoded (08:00-21:00, Sunday closed),
    // there is no need to fetch settings from the database. All validation uses
    // hardcoded constants, so the previous "Fallback when settings cannot be loaded"
    // tests have been removed as they are no longer applicable.
});
