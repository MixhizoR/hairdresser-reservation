const dbService = require('../../src/services/db.service');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        appointment: {
            count: jest.fn()
        },
        user: {
            count: jest.fn()
        }
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma)
    };
});

describe('Database Service Stats', () => {
    let prismaMock;

    beforeEach(() => {
        prismaMock = new PrismaClient();
        jest.clearAllMocks();
    });

    it('getDashboardStats should not return completedAppointments', async () => {
        // Mocking individual counts
        // 1. totalAppointments
        // 2. pendingAppointments
        // 3. approvedAppointments (now only 'approved', no 'completed')
        // 4. activeBarbers
        // 5. todayAppointments
        
        prismaMock.appointment.count
            .mockResolvedValueOnce(10) // total
            .mockResolvedValueOnce(3)  // pending
            .mockResolvedValueOnce(5)  // approved only
            .mockResolvedValueOnce(2); // today

        prismaMock.user.count.mockResolvedValue(4); // active barbers

        const result = await dbService.getDashboardStats();

        expect(result.totalAppointments).toBe(10);
        expect(result.pendingAppointments).toBe(3);
        expect(result.approvedAppointments).toBe(5);
        expect(result.activeBarbers).toBe(4);
        expect(result.todayAppointments).toBe(2);
        
        // Ensure completedAppointments is NOT in the result
        expect(result.completedAppointments).toBeUndefined();

        // Verify that approvedAppointments query uses only 'approved' (no 'completed')
        expect(prismaMock.appointment.count).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                status: 'approved'
            }
        }));
    });
});
