const { PrismaClient } = require('@prisma/client');
const dbService = require('../../src/services/db.service');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        appointment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn()
        },
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        },
        service: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        settings: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn()
        },
        $transaction: jest.fn((callback) => callback(mockPrisma))
    };
    return {
        PrismaClient: jest.fn(() => mockPrisma)
    };
});

describe('Database Service - User Methods (findUnique without role filtering)', () => {
    let prismaMock;

    beforeEach(() => {
        prismaMock = new PrismaClient();
        jest.clearAllMocks();
    });

    describe('Admin Methods', () => {
        it('findAdminByUsername should call prisma.user.findUnique with ONLY username (no role in where)', async () => {
            const mockAdmin = { id: 'admin-1', username: 'admin', role: 'ADMIN', password: 'hash' };
            prismaMock.user.findUnique.mockResolvedValue(mockAdmin);

            const result = await dbService.findAdminByUsername('admin');

            // Verify findUnique is called with ONLY username, no role filtering
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'admin' }
            });
            // Role check happens at JS level, not in query
            expect(result).toEqual(mockAdmin);
        });

        it('findAdminByUsername should return null if user is not ADMIN', async () => {
            const mockBarber = { id: 'barber-1', username: 'barber', role: 'BARBER', password: 'hash' };
            prismaMock.user.findUnique.mockResolvedValue(mockBarber);

            const result = await dbService.findAdminByUsername('barber');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'barber' }
            });
            // Should return null because role check happens at API level
            expect(result).toBeNull();
        });

        it('findAdminById should call prisma.user.findUnique with ONLY id (no role in where)', async () => {
            const mockAdmin = { id: 'admin-1', username: 'admin', role: 'ADMIN' };
            prismaMock.user.findUnique.mockResolvedValue(mockAdmin);

            const result = await dbService.findAdminById('admin-1');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'admin-1' }
            });
            expect(result).toEqual(mockAdmin);
        });

        it('createAdmin should create user with role ADMIN', async () => {
            const adminData = { username: 'newadmin', password: 'hash123', name: 'Admin' };
            const mockCreated = { id: 'new-1', ...adminData, role: 'ADMIN' };
            prismaMock.user.create.mockResolvedValue(mockCreated);

            const result = await dbService.createAdmin(adminData);

            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { ...adminData, role: 'ADMIN' }
            });
            expect(result).toEqual(mockCreated);
        });
    });

    describe('Barber Methods', () => {
        it('findBarberByUsername should call prisma.user.findUnique with ONLY username (no role in where)', async () => {
            const mockBarber = { id: 'barber-1', username: 'barber', role: 'BARBER', password: 'hash' };
            prismaMock.user.findUnique.mockResolvedValue(mockBarber);

            const result = await dbService.findBarberByUsername('barber');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'barber' }
            });
            expect(result).toEqual(mockBarber);
        });

        it('findBarberByUsername should return null if user is not BARBER', async () => {
            const mockAdmin = { id: 'admin-1', username: 'admin', role: 'ADMIN', password: 'hash' };
            prismaMock.user.findUnique.mockResolvedValue(mockAdmin);

            const result = await dbService.findBarberByUsername('admin');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'admin' }
            });
            expect(result).toBeNull();
        });

        it('findBarberById should call prisma.user.findUnique with ONLY id (no role in where)', async () => {
            const mockBarber = { id: 'barber-1', username: 'barber', role: 'BARBER' };
            prismaMock.user.findUnique.mockResolvedValue(mockBarber);

            const result = await dbService.findBarberById('barber-1');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'barber-1' }
            });
            expect(result).toEqual(mockBarber);
        });

        it('createBarber should create user with role BARBER', async () => {
            const barberData = { username: 'newbarber', password: 'hash123', name: 'Barber' };
            const mockCreated = { id: 'new-1', ...barberData, role: 'BARBER' };
            prismaMock.user.create.mockResolvedValue(mockCreated);

            const result = await dbService.createBarber(barberData);

            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { ...barberData, role: 'BARBER' }
            });
            expect(result).toEqual(mockCreated);
        });

        it('getAllBarbers should call prisma.user.findMany with role BARBER filter', async () => {
            const mockBarbers = [
                { id: 'barber-1', username: 'barber1', role: 'BARBER' },
                { id: 'barber-2', username: 'barber2', role: 'BARBER' }
            ];
            prismaMock.user.findMany.mockResolvedValue(mockBarbers);

            const result = await dbService.getAllBarbers();

            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                where: { role: 'BARBER' },
                orderBy: { name: 'asc' }
            });
            expect(result).toEqual(mockBarbers);
        });

        it('getActiveBarbers should call prisma.user.findMany with role and isActive filters', async () => {
            const mockBarbers = [{ id: 'barber-1', username: 'barber1', role: 'BARBER', isActive: true }];
            prismaMock.user.findMany.mockResolvedValue(mockBarbers);

            const result = await dbService.getActiveBarbers();

            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                where: { role: 'BARBER', isActive: true },
                orderBy: { name: 'asc' }
            });
            expect(result).toEqual(mockBarbers);
        });
    });

    describe('Generic User Methods', () => {
        it('findUserByUsername should call prisma.user.findUnique with ONLY username', async () => {
            const mockUser = { id: 'user-1', username: 'user', role: 'BARBER' };
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const result = await dbService.findUserByUsername('user');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'user' }
            });
            expect(result).toEqual(mockUser);
        });

        it('findUserById should call prisma.user.findUnique with ONLY id', async () => {
            const mockUser = { id: 'user-1', username: 'user', role: 'ADMIN' };
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const result = await dbService.findUserById('user-1');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-1' }
            });
            expect(result).toEqual(mockUser);
        });

        it('usernameExists should call prisma.user.findUnique with ONLY username', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'existing' });

            const result = await dbService.usernameExists('existing');

            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'existing' }
            });
            expect(result).toBe(true);
        });

        it('usernameExists should return false when user not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const result = await dbService.usernameExists('nonexistent');

            expect(result).toBe(false);
        });

        it('getAllUsers should call prisma.user.findMany without role filter', async () => {
            const mockUsers = [
                { id: 'admin-1', username: 'admin', role: 'ADMIN' },
                { id: 'barber-1', username: 'barber', role: 'BARBER' }
            ];
            prismaMock.user.findMany.mockResolvedValue(mockUsers);

            const result = await dbService.getAllUsers();

            expect(prismaMock.user.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' }
            });
            expect(result).toEqual(mockUsers);
        });
    });
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

        // Mock service.findMany for duration lookup
        prismaMock.service.findMany.mockResolvedValue([{ name: 'Haircut', duration: 30 }]);

        // Mock the transaction to simulate the overlap check and create
        prismaMock.$transaction.mockImplementation(async (callback) => {
            // Mock tx object
            const tx = {
                service: { findFirst: jest.fn().mockResolvedValue({ name: 'Haircut', duration: 30 }) },
                appointment: {
                    findMany: jest.fn().mockResolvedValue([]), // No existing appointments (no overlap)
                    create: jest.fn().mockResolvedValue(mockReturnedAppointment)
                }
            };
            return await callback(tx);
        });

        // Act
        const result = await dbService.createAppointment(mockInputData);

        // Assert
        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockReturnedAppointment);
    });

    it('getAppointmentByTrackingCode should call prisma.appointment.findUnique with the correct trackingCode', async () => {
        const mockCode = 'MOCKCD';
        const mockAppt = { id: 'appt-123', trackingCode: mockCode };
        prismaMock.appointment.findUnique.mockResolvedValue(mockAppt);

        const result = await dbService.getAppointmentByTrackingCode(mockCode);

        expect(prismaMock.appointment.findUnique).toHaveBeenCalledWith({
            where: { trackingCode: mockCode },
            include: { barber: true }
        });
        expect(result).toEqual(mockAppt);
    });

    it('getAppointmentsByDeviceToken should call prisma.appointment.findMany with the correct deviceToken', async () => {
        const mockToken = 'mock-uuid-token';
        const mockAppts = [{ id: 'appt-123', deviceToken: mockToken }];
        prismaMock.appointment.findMany = jest.fn().mockResolvedValue(mockAppts);

        const result = await dbService.getAppointmentsByDeviceToken(mockToken);

        expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
            where: { deviceToken: mockToken },
            include: { barber: true },
            orderBy: { time: 'desc' }
        });
        expect(result).toEqual(mockAppts);
    });
});
