const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

// Mock db.service
jest.mock('../../src/services/db.service');

describe('Appointment Controller Status Validation', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', role: 'ADMIN' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('PATCH /api/appointments/:id', () => {
        it('should return 400 if status is "completed"', async () => {
            const res = await request(app)
                .patch('/api/appointments/appt-123')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'completed' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz durum.');
        });

        it('should allow valid statuses (approved, rejected, pending)', async () => {
            dbService.getAppointmentById.mockResolvedValue({ id: 'appt-123', barberId: 'barber-1' });
            dbService.updateAppointment.mockResolvedValue({ id: 'appt-123', status: 'approved' });

            const res = await request(app)
                .patch('/api/appointments/appt-123')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(200);
        });
    });
});
