const request = require('supertest');
const app = require('../../src/app');

// Mock db.service
jest.mock('../../src/services/db.service', () => ({
    createAppointment: jest.fn(),
    findAppointmentByTimeForBarber: jest.fn()
}));
const dbService = require('../../src/services/db.service');

describe('Appointment Routes (Integration)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/appointments', () => {
        it('should return deviceToken and trackingCode upon successful booking', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            futureDate.setMinutes(0);
            futureDate.setSeconds(0);
            futureDate.setMilliseconds(0);

            const mockApptData = {
                id: 'appt-123',
                name: 'Test User',
                phone: '05321234567',
                service: 'Saç Kesimi',
                time: futureDate.toISOString(),
                status: 'pending',
                barberId: 'barber-123',
                deviceToken: 'test-uuid-123',
                trackingCode: 'TESTCD'
            };
            
            dbService.createAppointment.mockResolvedValue(mockApptData);

            const res = await request(app)
                .post('/api/appointments')
                .send({
                    name: 'Test User',
                    phone: '05321234567',
                    service: 'Saç Kesimi',
                    time: mockApptData.time,
                    barberId: 'barber-123'
                });

            expect(res.status).toBe(201);
            
            // Check that the returned appointment contains the tokens
            expect(res.body.deviceToken).toBe('test-uuid-123');
            expect(res.body.trackingCode).toBe('TESTCD');
        });
    });

    describe('GET /api/appointments/track', () => {
        const mockApptData = {
            id: 'appt-123',
            name: 'John Doe',
            phone: '05321234567',
            service: 'Saç Kesimi',
            time: new Date().toISOString(),
            status: 'pending',
            notes: 'Some secret note',
            barberId: 'barber-123',
            deviceToken: 'test-uuid-123',
            trackingCode: 'TESTCD',
            barber: { name: 'Barber Bob' }
        };

        it('should return masked data when trackingCode is provided', async () => {
            // Setup mock for getAppointmentByTrackingCode
            dbService.getAppointmentByTrackingCode = jest.fn().mockResolvedValue(mockApptData);

            const res = await request(app).get('/api/appointments/track?code=TESTCD');

            expect(res.status).toBe(200);
            expect(dbService.getAppointmentByTrackingCode).toHaveBeenCalledWith('TESTCD');
            
            // Verify masking
            const appt = res.body[0];
            expect(appt.name).toBe('J*** D***');
            expect(appt.phone).toBeUndefined();
            expect(appt.notes).toBeUndefined();
            expect(appt.barberName).toBe('Barber Bob');
            expect(appt.status).toBe('pending');
            expect(appt.service).toBe('Saç Kesimi');
        });

        it('should return masked data when deviceToken is provided', async () => {
            // Setup mock for getAppointmentsByDeviceToken
            dbService.getAppointmentsByDeviceToken = jest.fn().mockResolvedValue([mockApptData]);

            const res = await request(app).get('/api/appointments/track?deviceToken=test-uuid-123');

            expect(res.status).toBe(200);
            expect(dbService.getAppointmentsByDeviceToken).toHaveBeenCalledWith('test-uuid-123');
            
            // Verify masking
            const appt = res.body[0];
            expect(appt.name).toBe('J*** D***');
            expect(appt.phone).toBeUndefined();
            expect(appt.notes).toBeUndefined();
        });

        it('should return 400 if neither code nor deviceToken is provided', async () => {
            const res = await request(app).get('/api/appointments/track');
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
    });
});
