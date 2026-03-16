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
app.use(cors({
    origin: isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser (10kb limit) ───
app.use(express.json({ limit: '10kb' }));

// ─── Global Rate Limiter ───
app.use(generalLimiter);

// ─── API Routes ───
app.use('/api', apiRoutes);

// ─── Serve Static Files (React Build) ───
app.use(express.static(path.join(__dirname, '..', 'dist')));

// SPA Catch-all (must be after API routes)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

module.exports = app;
