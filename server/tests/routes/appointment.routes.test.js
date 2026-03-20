const request = require('supertest');
const app = require('../../src/app');

// Mock db.service
jest.mock('../../src/services/db.service', () => ({
    createAppointment: jest.fn(),
    findAppointmentByTimeForBarber: jest.fn()
}));
const dbService = require('../../src/services/db.service');

// Disable socket.io initialization during tests
jest.mock('../../src/socket', () => ({
    getIO: jest.fn(() => ({
        emit: jest.fn()
    }))
}));

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
});
