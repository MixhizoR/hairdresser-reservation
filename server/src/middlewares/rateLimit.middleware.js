const rateLimit = require('express-rate-limit');
const { isDev } = require('../config/env');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 100,
    message: { error: 'Çok fazla istek gönderildi. 15 dakika bekleyin.' },
    standardHeaders: true, legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 10,
    message: { error: 'Çok fazla giriş denemesi. 15 dakika bekleyin.' },
    standardHeaders: true, legacyHeaders: false,
});

const appointmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 5,
    message: { error: 'Çok fazla randevu talebi. 15 dakika bekleyin.' },
    standardHeaders: true, legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    loginLimiter,
    appointmentLimiter,
};
