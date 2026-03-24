const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { isDev, ALLOWED_ORIGIN } = require('./config/env');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');
const { requestLogger } = require('./middlewares/requestLogger.middleware');
const apiRoutes = require('./routes/index');

const app = express();

// ─── Security Headers ───
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// ─── Request Logger ───
app.use(requestLogger);

// ─── CORS ───
const corsOptions = {
    origin: isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

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

// ─── Centralized Error Handler ───
app.use((err, req, res, next) => {
  const { log } = require('./config/logger');
  log('error', err.message, { stack: err.stack, path: req.path, method: req.method });
  res.status(err.status || 500).json({ 
    error: err.message || 'Sunucu hatası.' 
  });
});

module.exports = app;
