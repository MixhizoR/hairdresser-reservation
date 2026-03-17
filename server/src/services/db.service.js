const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { log } = require('../config/logger');

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

const createAppointment = async (data) => {
    return await prisma.appointment.create({
        data,
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
    const approvedAppointments = await prisma.appointment.count({ where: { status: 'approved' } });
    const completedAppointments = await prisma.appointment.count({ where: { status: 'completed' } });
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
        completedAppointments,
        activeBarbers,
        todayAppointments
    };
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
    findAppointmentByTime,
    findAppointmentByTimeForBarber,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    // Dashboard
    getDashboardStats,
    connect,
};
