const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { isDev, ALLOWED_ORIGIN } = require('./config/env');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');
const apiRoutes = require('./routes/index');

const app = express();

// ─── Security Headers ───
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// ─── CORS ───
// Production'da tüm origin'lere izin ver (mobil cihazlar için gerekli)
app.use(cors({
    origin: isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : ALLOWED_ORIGIN, credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Body Parser (10kb limit) ───
app.use(express.json({ limit: '10kb' }));

// ─── Global Rate Limiter ───
app.use(generalLimiter);

// ─── API Routes ───
app.use('/api', apiRoutes);

// ─── Health Check ───
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = app;
