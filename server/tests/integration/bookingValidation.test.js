const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

jest.mock('../../src/middlewares/rateLimit.middleware', () => {
    const noop = (req, res, next) => next();
    return {
        generalLimiter: noop,
        loginLimiter: noop,
        appointmentLimiter: noop,
        trackLimiter: noop,
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

    const standardOperatingHours = () => ({
        monday: { open: '09:00', close: '20:00', closed: false },
        tuesday: { open: '09:00', close: '20:00', closed: false },
        wednesday: { open: '09:00', close: '20:00', closed: false },
        thursday: { open: '09:00', close: '20:00', closed: false },
        friday: { open: '09:00', close: '20:00', closed: false },
        saturday: { open: '10:00', close: '18:00', closed: false },
        sunday: { open: '09:00', close: '18:00', closed: true }
    });

    // ==================== ALLOWED BOOKINGS ====================

    describe('Allow booking during configured working hours', () => {
        it('should allow booking at the opening time (09:00)', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

            const monday9am = getNextMondayAt(9, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday9am.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
            expect(dbService.createAppointment).toHaveBeenCalled();
        });

        it('should allow booking at 30-min slot (14:30)', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

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

        it('should allow booking at last valid slot (18:30 for 19:00 hard close)', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

            const monday1830 = getNextMondayAt(18, 30);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday1830.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(201);
        });

        it('should allow booking on Saturday within its hours', async () => {
            const hours = standardOperatingHours();
            hours.saturday = { open: '10:00', close: '18:00', closed: false };

            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(hours) }
            ]);

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

    describe('Reject booking outside configured working hours', () => {
        it('should reject booking before opening time', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

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

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/çalışma saatleri dışındadır/i);
        });

        it('should reject booking at closing time (exact close hour)', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

            const monday8pm = getNextMondayAt(20, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday8pm.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/çalışma saatleri dışındadır/i);
        });

        it('should reject booking after closing time', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

            const monday2100 = getNextMondayAt(21, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday2100.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/çalışma saatleri dışındadır/i);
        });

        it('should reject booking with proper error message containing hours range', async () => {
            const hours = standardOperatingHours();
            hours.monday = { open: '10:00', close: '17:00', closed: false };

            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(hours) }
            ]);

            const monday9am = getNextMondayAt(9, 0);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: monday9am.toISOString(),
                    barberId: 'barber-1'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('08:30');
            expect(res.body.error).toContain('19:00');
        });
    });

    // ==================== CLOSED DAY ====================

    describe('Reject booking on closed days', () => {
        it('should reject booking on Sunday (configured as closed)', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(standardOperatingHours()) }
            ]);

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

        it('should reject booking on any day configured as closed', async () => {
            const hours = standardOperatingHours();
            hours.tuesday = { open: '09:00', close: '20:00', closed: true };

            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: JSON.stringify(hours) }
            ]);

            const date = new Date();
            const daysUntilTuesday = (2 - date.getDay() + 7) % 7 || 7;
            date.setDate(date.getDate() + daysUntilTuesday);
            date.setHours(14, 0, 0, 0);
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
    });

    // ==================== FALLBACK ====================

    describe('Fallback when settings cannot be loaded', () => {
        it('should allow booking if getAllSettings throws an error', async () => {
            dbService.getAllSettings.mockRejectedValue(new Error('DB error'));

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

        it('should allow booking if operatingHours setting is missing', async () => {
            dbService.getAllSettings.mockResolvedValue([]);

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

        it('should allow booking if operatingHours value is invalid JSON', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: 'not-json' }
            ]);

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

            // operatingHours parsed as string "not-json", no matching day config → no restriction
            expect(res.status).toBe(201);
        });
    });
});
