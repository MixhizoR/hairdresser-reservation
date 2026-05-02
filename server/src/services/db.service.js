const { PrismaClient, Level } = require('@prisma/client');
const prisma = new PrismaClient();
const { log } = require('../config/logger');
const crypto = require('crypto');

// ==================== ADMIN METHODS ====================

const findAdminByUsername = async (username) => {
    const user = await prisma.user.findUnique({ where: { username } });
    return user && user.role === 'ADMIN' ? user : null;
};

const findAdminById = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    return user && user.role === 'ADMIN' ? user : null;
};

const createAdmin = async (data) => {
    return await prisma.user.create({ data: { ...data, role: 'ADMIN' } });
};

// ==================== BARBER METHODS ====================

const findBarberByUsername = async (username) => {
    const user = await prisma.user.findUnique({ where: { username } });
    return user && user.role === 'BARBER' ? user : null;
};

const findBarberById = async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    return user && user.role === 'BARBER' ? user : null;
};

const createBarber = async (data) => {
    return await prisma.user.create({ data: { ...data, role: 'BARBER' } });
};

const updateBarber = async (id, data) => {
    return await prisma.user.update({ where: { id }, data });
};

const deleteBarber = async (id) => {
    return await prisma.user.delete({ where: { id } });
};

const getAllBarbers = async () => {
    return await prisma.user.findMany({
        where: { role: 'BARBER' },
        orderBy: { name: 'asc' }
    });
};

const getActiveBarbers = async () => {
    return await prisma.user.findMany({
        where: { role: 'BARBER', isActive: true },
        orderBy: { name: 'asc' }
    });
};

// ==================== GENERIC USER METHODS (Unified Auth) ====================

const findUserByUsername = async (username) => {
    return await prisma.user.findUnique({ where: { username } });
};

const findUserById = async (id) => {
    return await prisma.user.findUnique({ where: { id } });
};

const getAllUsers = async () => {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

const updateUser = async (id, data) => {
    const user = await findUserById(id);
    if (!user) return null;

    return await prisma.user.update({ where: { id }, data });
};

const deleteUser = async (id) => {
    const user = await findUserById(id);
    if (!user) return null;

    return await prisma.user.delete({ where: { id } });
};

const usernameExists = async (username) => {
    const user = await prisma.user.findUnique({ where: { username } });
    return !!user;
};

// ==================== APPOINTMENT METHODS ====================

const getAppointments = async (filters = {}, options = {}) => {
    return await prisma.appointment.findMany({
        where: filters,
        include: { barber: true },
        orderBy: { time: options.orderBy || 'asc' },
        ...(options.take ? { take: options.take } : {}),
        ...(options.skip ? { skip: options.skip } : {}),
    });
};

const getAppointmentById = async (id) => {
    return await prisma.appointment.findUnique({
        where: { id },
        include: { barber: true }
    });
};

const findAppointmentByTimeForBarber = async (date, barberId) => {
    return await prisma.appointment.findFirst({
        where: {
            time: date,
            barberId: barberId,
            status: { not: 'rejected' }
        }
    });
};

const getAppointmentByTrackingCode = async (trackingCode) => {
    return await prisma.appointment.findUnique({
        where: { trackingCode },
        include: { barber: true }
    });
};

const getAppointmentsByDeviceToken = async (deviceToken) => {
    return await prisma.appointment.findMany({
        where: { deviceToken },
        include: { barber: true },
        orderBy: { time: 'desc' }
    });
};

const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    // Use rejection sampling to avoid modulo bias
    while (result.length < 6) {
        const byte = crypto.randomBytes(1)[0];
        // Only accept values in the range that divides evenly into chars.length (36)
        // 256 / 36 = 7 remainder 4, so reject values >= 252
        if (byte < 252) {
            result += chars[byte % chars.length];
        }
    }
    return result;
};

const createAppointment = async (data) => {
    const appointmentData = {
        ...data,
        deviceToken: data.deviceToken || crypto.randomUUID(),
        trackingCode: data.trackingCode || generateTrackingCode()
    };

    // Resolve unique tracking code (with bias fix from Issue 2)
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
        const existing = await prisma.appointment.findUnique({ where: { trackingCode: appointmentData.trackingCode } });
        if (!existing) isUnique = true;
        else { appointmentData.trackingCode = generateTrackingCode(); attempts++; }
    }
    if (!isUnique) throw new Error('Could not generate a unique tracking code after 5 attempts.');

    // Fetch services for duration lookup (done outside transaction for efficiency)
    const services = await prisma.service.findMany({});
    const serviceMap = {};
    services.forEach(s => { serviceMap[s.name] = s; });

    return await prisma.$transaction(async (tx) => {
        // Fetch service duration to calculate appointment end time (unless using customDuration)
        const service = await tx.service.findFirst({
            where: { name: appointmentData.service }
        });
        const duration = appointmentData.customDuration ? parseInt(appointmentData.customDuration) : (service?.duration || 30);
        const startTime = new Date(appointmentData.time);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // Check for overlapping appointments for this barber
        // Overlap occurs if: (existing_start < new_end) AND (existing_end > new_start)
        // Back-to-back appointments (existing_end === new_start) are allowed
        const existingAppointments = await tx.appointment.findMany({
            where: {
                barberId: appointmentData.barberId,
                status: { not: 'rejected' },
                time: {
                    gte: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()),
                    lt: new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + 1)
                }
            }
        });

        for (const existing of existingAppointments) {
            const existingStart = new Date(existing.time);
            const existingService = serviceMap[existing.service];
            const existingDuration = existingService?.duration || 30;
            const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

            // Check for overlap (not just exact match)
            // Overlap: (existingStart < endTime) AND (existingEnd > startTime)
            if (existingStart < endTime && existingEnd > startTime) {
                const err = new Error('Seçilen berber bu saat aralığında başka bir randevuya sahip.');
                err.code = 'TIME_SLOT_TAKEN';
                throw err;
            }
        }

        return await tx.appointment.create({
            data: appointmentData,
            include: { barber: true }
        });
    });
};

const updateAppointment = async (id, data) => {
    return await prisma.appointment.update({
        where: { id },
        data,
        include: { barber: true }
    });
};

const deleteAppointment = async (id) => {
    return await prisma.appointment.delete({ where: { id } });
};

const rejectPastPending = async () => {
    return await prisma.appointment.updateMany({
        where: { status: 'pending', time: { lt: new Date() } },
        data: { status: 'rejected' }
    });
};

const deleteRejectedAppointments = async () => {
    const result = await prisma.appointment.deleteMany({
        where: { status: 'rejected' }
    });
    return { count: result.count };
};

// ==================== DASHBOARD STATS ====================

const getDashboardStats = async () => {
    const totalAppointments = await prisma.appointment.count();
    const pendingAppointments = await prisma.appointment.count({ where: { status: 'pending' } });
    const approvedAppointments = await prisma.appointment.count({
        where: {
            status: 'approved'
        }
    });
    const activeBarbers = await prisma.user.count({ where: { role: 'BARBER', isActive: true } });

    // Today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await prisma.appointment.count({
        where: {
            time: {
                gte: today,
                lt: tomorrow
            }
        }
    });

    return {
        totalAppointments,
        pendingAppointments,
        approvedAppointments,
        activeBarbers,
        todayAppointments
    };
};

// ==================== SERVICE METHODS ====================

const getAllServices = async () => {
    return await prisma.service.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

const getActiveServices = async () => {
    return await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });
};

const getServiceById = async (id) => {
    return await prisma.service.findUnique({ where: { id } });
};

const findServiceByName = async (name) => {
    return await prisma.service.findFirst({
        where: { name, isActive: true }
    });
};

const createService = async (data) => {
    return await prisma.service.create({ data });
};

const updateService = async (id, data) => {
    return await prisma.service.update({ where: { id }, data });
};

const deleteService = async (id) => {
    return await prisma.service.delete({ where: { id } });
};

// ==================== SETTINGS METHODS ====================

const getAllSettings = async () => {
    return await prisma.settings.findMany();
};

const getSettingByKey = async (key) => {
    return await prisma.settings.findUnique({ where: { key } });
};

const upsertSetting = async (key, value) => {
    return await prisma.settings.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value },
    });
};

// ==================== CONNECTION ====================

const connect = async () => {
    try {
        await prisma.$connect();
        log('info', 'SQLite connected');
    } catch (err) {
        log('error', 'SQLite connection failed', { err: err.message });
        process.exit(1);
    }
};

// Generic create user (handles both roles)
const createUser = async (data) => {
    return await prisma.user.create({ data });
};

module.exports = {
    // User
    findUserByUsername,
    findUserById,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    createAdmin,
    findAdminByUsername,
    findAdminById,
    createBarber,
    updateBarber,
    deleteBarber,
    findBarberByUsername,
    findBarberById,
    getAllBarbers,
    getActiveBarbers,
    usernameExists,
    // Appointment
    getAppointments,
    getAppointmentById,
    getAppointmentByTrackingCode,
    getAppointmentsByDeviceToken,
    findAppointmentByTimeForBarber,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    rejectPastPending,
    deleteRejectedAppointments,
    // Service
    getAllServices,
    getActiveServices,
    getServiceById,
    findServiceByName,
    createService,
    updateService,
    deleteService,
    // Settings
    getAllSettings,
    getSettingByKey,
    upsertSetting,
    // Dashboard
    getDashboardStats,
    connect,
    Level
};
