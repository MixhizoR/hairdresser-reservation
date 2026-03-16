const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { log } = require('../config/logger');

const getAppointments = async () => {
    return await prisma.appointment.findMany({ orderBy: { createdAt: 'desc' } });
};

const findAppointmentByTime = async (date) => {
    return await prisma.appointment.findFirst({ where: { time: date, status: { not: 'rejected' } } });
};

const createAppointment = async (data) => {
    return await prisma.appointment.create({ data });
};

const updateAppointment = async (id, status) => {
    return await prisma.appointment.update({ where: { id }, data: { status } });
};

const findAdmin = async (username) => {
    return await prisma.admin.findUnique({ where: { username } });
};

const createAdmin = async (username, hash) => {
    return await prisma.admin.create({ data: { username, password: hash } });
};

const usernameExists = async (username) => {
    return !!(await prisma.admin.findUnique({ where: { username } }));
};

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
    getAppointments,
    findAppointmentByTime,
    createAppointment,
    updateAppointment,
    findAdmin,
    createAdmin,
    usernameExists,
    connect,
};
