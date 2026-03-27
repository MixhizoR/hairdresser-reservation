const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service', () => ({
    createAppointment: jest.fn(),
    findAppointmentByTimeForBarber: jest.fn().mockResolvedValue(null),
    findServiceByName: jest.fn().mockResolvedValue({ id: 'svc-1', name: 'Saç Kesimi', isActive: true }),
    getAppointmentById: jest.fn(),
    getAppointments: jest.fn(),
    deleteAppointment: jest.fn(),
    updateAppointment: jest.fn()
}));

jest.mock('../../src/middlewares/rateLimit.middleware', () => {
    const noop = (req, res, next) => next();
    return {
        generalLimiter: noop,
        loginLimiter: noop,
        appointmentLimiter: noop,
        trackLimiter: noop,
    };
});

describe('Appointment Controller (Extended)', () => {
    let adminToken;
    let barberToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
        barberToken = jwt.sign({ id: 'barber-1', username: 'barber1', role: 'BARBER' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        dbService.findAppointmentByTimeForBarber.mockResolvedValue(null);
        dbService.findServiceByName.mockResolvedValue({ id: 'svc-1', name: 'Saç Kesimi', isActive: true });
    });

    const getFutureDate = (minutesOffset = 0) => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(10, 0, 0, 0);
        date.setMinutes(date.getMinutes() + minutesOffset);
        return date;
    };

    // ==================== CREATE APPOINTMENT ====================
    describe('POST /api/appointments', () => {
        it('should silently accept honeypot field and return 201', async () => {
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Bot User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123',
                    website: 'http://spam.com'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('pending');
            expect(dbService.createAppointment).not.toHaveBeenCalled();
        });

        it('should return 400 if service does not exist in database', async () => {
            dbService.findServiceByName.mockResolvedValue(null);
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'NonExistent',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz hizmet seçimi.');
        });

        it('should return 400 if service is inactive', async () => {
            dbService.findServiceByName.mockResolvedValue(null);
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Inactive Service',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz hizmet seçimi.');
        });

        it('should return 400 for invalid name with special characters', async () => {
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'John!@#Doe',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz isim. Sadece harf kullanın (2-50 karakter).');
        });

        it('should return 400 for name that is too short', async () => {
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'J',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz isim. Sadece harf kullanın (2-50 karakter).');
        });

        it('should return 400 for invalid phone number', async () => {
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '1234567890',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz telefon. Format: 05xxxxxxxxx');
        });

        it('should return 400 if barberId is missing', async () => {
            const futureDate = getFutureDate();

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString()
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Lütfen bir berber seçin.');
        });

        it('should return 400 for invalid date', async () => {
            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: 'not-a-date',
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz tarih.');
        });

        it('should return 400 for past date', async () => {
            const pastDate = new Date('2020-01-01T10:00:00Z');

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: pastDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçmiş bir saat seçilemez.');
        });

        it('should return 400 for non-30 minute interval', async () => {
            const date = getFutureDate();
            date.setMinutes(15);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: date.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz saat dilimi (00 veya 30 dakika olmalı).');
        });

        it('should return 400 if time slot is already taken for barber', async () => {
            const futureDate = getFutureDate();
            dbService.findAppointmentByTimeForBarber.mockResolvedValue({
                id: 'existing-appt',
                time: futureDate,
                barberId: 'barber-123'
            });

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Bu saat dilimi seçtiğiniz berber için zaten rezerve edilmiş.');
        });

        it('should return 201 on successful creation', async () => {
            const futureDate = getFutureDate();
            dbService.createAppointment.mockResolvedValue({
                id: 'appt-new',
                name: 'Test User',
                phone: '05321234567',
                service: 'Saç Kesimi',
                time: futureDate.toISOString(),
                status: 'pending',
                barberId: 'barber-123',
                deviceToken: 'uuid-123',
                trackingCode: 'ABC123'
            });

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(201);
            expect(res.body.id).toBe('appt-new');
            expect(res.body.status).toBe('pending');
            expect(res.body.deviceToken).toBe('uuid-123');
            expect(res.body.trackingCode).toBe('ABC123');
        });

        it('should trim name and phone before saving', async () => {
            const futureDate = getFutureDate();
            dbService.createAppointment.mockResolvedValue({
                id: 'appt-1',
                name: 'Test User',
                phone: '05321234567',
                service: 'Saç Kesimi',
                time: futureDate.toISOString(),
                status: 'pending'
            });

            await request(app)
                .post('/api/appointments')
                .send({
                    name: '  Test User  ',
                    phone: '  05321234567  ',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(dbService.createAppointment).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Test User',
                phone: '05321234567'
            }));
        });

        it('should accept valid Turkish names', async () => {
            const futureDate = getFutureDate();
            dbService.createAppointment.mockResolvedValue({
                id: 'appt-1',
                name: 'Ömer Çağrı',
                status: 'pending'
            });

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Ömer Çağrı',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: futureDate.toISOString(),
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(201);
        });
    });

    // ==================== GET SINGLE APPOINTMENT ====================
    describe('GET /api/appointments/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/appointments/appt-1');
            expect(res.status).toBe(401);
        });

        it('should return 404 if appointment not found', async () => {
            dbService.getAppointmentById.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/appointments/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Randevu bulunamadı.');
        });

        it('should return 403 if barber tries to access another barber\'s appointment', async () => {
            dbService.getAppointmentById.mockResolvedValue({
                id: 'appt-1',
                barberId: 'other-barber'
            });

            const res = await request(app)
                .get('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Bu randevuyu görüntüleme yetkiniz yok.');
        });

        it('should return 200 if barber accesses own appointment', async () => {
            dbService.getAppointmentById.mockResolvedValue({
                id: 'appt-1',
                barberId: 'barber-1',
                name: 'Test User',
                service: 'Saç Kesimi'
            });

            const res = await request(app)
                .get('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('appt-1');
        });

        it('should return 200 if admin accesses any appointment', async () => {
            dbService.getAppointmentById.mockResolvedValue({
                id: 'appt-1',
                barberId: 'barber-1',
                name: 'Test User',
                service: 'Saç Kesimi'
            });

            const res = await request(app)
                .get('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('appt-1');
        });
    });

    // ==================== DELETE APPOINTMENT ====================
    describe('DELETE /api/appointments/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).delete('/api/appointments/appt-1');
            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to delete', async () => {
            const res = await request(app)
                .delete('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(403);
        });

        it('should return 404 if appointment not found', async () => {
            dbService.getAppointmentById.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/appointments/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Randevu bulunamadı.');
        });

        it('should return 200 on successful deletion', async () => {
            dbService.getAppointmentById.mockResolvedValue({ id: 'appt-1', barberId: 'barber-1' });
            dbService.deleteAppointment.mockResolvedValue();

            const res = await request(app)
                .delete('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(dbService.deleteAppointment).toHaveBeenCalledWith('appt-1');
        });
    });

    // ==================== GET APPOINTMENTS (LIST) ====================
    describe('GET /api/appointments', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/appointments');
            expect(res.status).toBe(401);
        });

        it('should filter by barberId when barber requests', async () => {
            dbService.getAppointments.mockResolvedValue([]);

            await request(app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(dbService.getAppointments).toHaveBeenCalledWith(
                expect.objectContaining({ barberId: 'barber-1' })
            );
        });

        it('should allow admin to see all appointments', async () => {
            dbService.getAppointments.mockResolvedValue([]);

            await request(app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(dbService.getAppointments).toHaveBeenCalledWith(
                expect.not.objectContaining({ barberId: expect.anything() })
            );
        });

        it('should allow admin to filter by barberId', async () => {
            dbService.getAppointments.mockResolvedValue([]);

            await request(app)
                .get('/api/appointments?barberId=barber-2')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(dbService.getAppointments).toHaveBeenCalledWith(
                expect.objectContaining({ barberId: 'barber-2' })
            );
        });

        it('should filter by status', async () => {
            dbService.getAppointments.mockResolvedValue([]);

            await request(app)
                .get('/api/appointments?status=pending')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(dbService.getAppointments).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'pending' })
            );
        });

        it('should not filter by status when "all"', async () => {
            dbService.getAppointments.mockResolvedValue([]);

            await request(app)
                .get('/api/appointments?status=all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(dbService.getAppointments).toHaveBeenCalledWith(
                expect.not.objectContaining({ status: expect.anything() })
            );
        });

        it('should filter by date', async () => {
            dbService.getAppointments.mockResolvedValue([]);

            await request(app)
                .get('/api/appointments?date=2026-03-28')
                .set('Authorization', `Bearer ${adminToken}`);

            const callArgs = dbService.getAppointments.mock.calls[0][0];
            expect(callArgs.time).toBeDefined();
            expect(callArgs.time.gte).toBeInstanceOf(Date);
            expect(callArgs.time.lte).toBeInstanceOf(Date);
        });
    });

    // ==================== UPDATE APPOINTMENT ====================
    describe('PATCH /api/appointments/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .patch('/api/appointments/appt-1')
                .send({ status: 'approved' });

            expect(res.status).toBe(401);
        });

        it('should return 404 if appointment not found', async () => {
            dbService.getAppointmentById.mockResolvedValue(null);

            const res = await request(app)
                .patch('/api/appointments/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Randevu bulunamadı.');
        });

        it('should return 403 if barber tries to update another barber\'s appointment', async () => {
            dbService.getAppointmentById.mockResolvedValue({
                id: 'appt-1',
                barberId: 'other-barber'
            });

            const res = await request(app)
                .patch('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Bu randevuyu güncelleme yetkiniz yok.');
        });

        it('should allow barber to update own appointment', async () => {
            dbService.getAppointmentById.mockResolvedValue({
                id: 'appt-1',
                barberId: 'barber-1'
            });
            dbService.updateAppointment.mockResolvedValue({
                id: 'appt-1',
                status: 'approved'
            });

            const res = await request(app)
                .patch('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(200);
        });

        it('should allow admin to update any appointment', async () => {
            dbService.getAppointmentById.mockResolvedValue({
                id: 'appt-1',
                barberId: 'barber-1'
            });
            dbService.updateAppointment.mockResolvedValue({
                id: 'appt-1',
                status: 'rejected'
            });

            const res = await request(app)
                .patch('/api/appointments/appt-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'rejected' });

            expect(res.status).toBe(200);
        });
    });
});
