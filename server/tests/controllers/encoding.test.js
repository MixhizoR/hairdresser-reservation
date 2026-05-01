const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');

// Mock db.service
jest.mock('../../src/services/db.service', () => ({
    createAppointment: jest.fn(),
    findAppointmentByTimeForBarber: jest.fn().mockResolvedValue(null),
    findServiceByName: jest.fn().mockResolvedValue({ id: 'svc-1', name: 'Saç & Sakal Kesimi', isActive: true }),
    getAllSettings: jest.fn().mockResolvedValue([])
}));

describe('Appointment Controller Encoding', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/appointments', () => {
        it('should NOT escape special characters in name and service', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            futureDate.setHours(10); // Ensure within working hours
            futureDate.setMinutes(0);
            futureDate.setSeconds(0);
            futureDate.setMilliseconds(0);

            const testData = {
                name: 'Jack & Jill',
                phone: '05321234567',
                service: 'Saç & Sakal Kesimi',
                time: futureDate.toISOString(),
                barberId: 'barber-123'
            };

            dbService.createAppointment.mockResolvedValue({ 
                id: 'appt-123', 
                ...testData,
                status: 'pending' 
            });

            const res = await request(app)
                .post('/api/appointments')
                .send(testData);

            expect(res.status).toBe(201);
            
            // Check that db.createAppointment was called with UNESCAPED characters
            // Currently it will FAIL because it is escaped to 'Jack &amp; Jill'
            expect(dbService.createAppointment).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Jack & Jill',
                service: 'Saç & Sakal Kesimi'
            }));
        });
    });
});
