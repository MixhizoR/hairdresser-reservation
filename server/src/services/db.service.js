const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { log } = require('../config/logger');
const crypto = require('crypto');

// ==================== USER METHODS ====================

const findUserByUsername = async (username) => {
    return await prisma.user.findUnique({ where: { username } });
};

const findUserById = async (id) => {
    return await prisma.user.findUnique({ where: { id } });
};

const createUser = async (data) => {
    return await prisma.user.create({ data });
};

const updateUser = async (id, data) => {
    return await prisma.user.update({ where: { id }, data });
};

const deleteUser = async (id) => {
    return await prisma.user.delete({ where: { id } });
};

const getAllBarbers = async () => {
    return await prisma.user.findMany({
        where: { role: 'BARBER', isActive: true },
        orderBy: { name: 'asc' }
    });
};

const getAllUsers = async () => {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });
};

const usernameExists = async (username) => {
    return !!(await prisma.user.findUnique({ where: { username } }));
};

// ==================== APPOINTMENT METHODS ====================

const getAppointments = async (filters = {}) => {
    return await prisma.appointment.findMany({
        where: filters,
        include: { barber: true },
        orderBy: { time: 'asc' }
    });
};

const getAppointmentById = async (id) => {
    return await prisma.appointment.findUnique({
        where: { id },
        include: { barber: true }
    });
};

const findAppointmentByTime = async (date, barberId) => {
    return await prisma.appointment.findFirst({
        where: {
            time: date,
            barberId: barberId,
            status: { not: 'rejected' }
        }
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
    const bytes = crypto.randomBytes(4);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars[bytes[i % bytes.length] % chars.length];
    }
    return result;
};

const createAppointment = async (data) => {
    const appointmentData = {
        ...data,
        deviceToken: data.deviceToken || crypto.randomUUID(),
        trackingCode: data.trackingCode || generateTrackingCode()
    };
    
    // Basit bir çarpışma önleme mekanizması (gerçek dünyada daha sağlam bir kontrol gerekir)
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
        const existing = await prisma.appointment.findUnique({ where: { trackingCode: appointmentData.trackingCode } });
        if (!existing) {
            isUnique = true;
        } else {
            appointmentData.trackingCode = generateTrackingCode();
            attempts++;
        }
    }

    return await prisma.appointment.create({
        data: appointmentData,
        include: { barber: true }
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

module.exports = {
    // User
    findUserByUsername,
    findUserById,
    createUser,
    updateUser,
    deleteUser,
    getAllBarbers,
    getAllUsers,
    usernameExists,
    // Appointment
    getAppointments,
    getAppointmentById,
    getAppointmentByTrackingCode,
    getAppointmentsByDeviceToken,
    findAppointmentByTime,
    findAppointmentByTimeForBarber,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    // Service
    getAllServices,
    getActiveServices,
    getServiceById,
    findServiceByName,
    createService,
    updateService,
    // Settings
    getAllSettings,
    getSettingByKey,
    upsertSetting,
    // Dashboard
    getDashboardStats,
    connect,
};
