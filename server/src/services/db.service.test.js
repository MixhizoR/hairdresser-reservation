const { PrismaClient } = require('@prisma/client');
const dbService = require('./db.service');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        appointment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        }
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma)
    };
});

describe('Database Service - Appointment Tracking', () => {
    let prismaMock;

    beforeEach(() => {
        prismaMock = new PrismaClient();
        jest.clearAllMocks();
    });

    it('createAppointment should generate deviceToken and trackingCode if not provided', async () => {
        // Arrange
        const mockInputData = {
            name: 'John Doe',
            phone: '1234567890',
            service: 'Haircut',
            time: new Date(),
            barberId: 'barber-123'
        };

        const mockReturnedAppointment = {
            id: 'appt-123',
            ...mockInputData,
            status: 'pending',
            deviceToken: 'mock-uuid',
            trackingCode: 'MOCKCD'
        };

        prismaMock.appointment.create.mockResolvedValue(mockReturnedAppointment);

        // Act
        const result = await dbService.createAppointment(mockInputData);

        // Assert
        expect(prismaMock.appointment.create).toHaveBeenCalledTimes(1);
        
        // Ensure create was called with dynamically generated tokens
        const createCallArgs = prismaMock.appointment.create.mock.calls[0][0];
        
        expect(createCallArgs.data.deviceToken).toBeDefined();
        // deviceToken should be a valid UUID v4
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(createCallArgs.data.deviceToken).toMatch(uuidRegex);

        expect(createCallArgs.data.trackingCode).toBeDefined();
        // trackingCode should be 6 characters alphanumeric
        const trackingCodeRegex = /^[A-Z0-9]{6}$/;
        expect(createCallArgs.data.trackingCode).toMatch(trackingCodeRegex);
    });
});
