const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
// ─── Environment Separation ───
const isDev = process.env.NODE_ENV === 'development';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ─── Security Headers ───
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

// ─── CORS ───
// In development, allow localhost origin explicitly or any if needed
app.use(cors({
    origin: isDev ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parser (10kb limit) ───
app.use(express.json({ limit: '10kb' }));

// ─── Rate Limiters ───
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
app.use(generalLimiter);

// ─── JWT Auth Middleware ───
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    }
    try {
        req.admin = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
};

// ─── Validation Helpers ───
const isValidPhone = (phone) => /^05\d{9}$/.test(phone);
const isValidName = (name) => {
    const t = name?.trim() || '';
    return t.length >= 2 && t.length <= 50 && /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(t);
};

// ─── DB Helpers ───
const db = {
    async getAppointments() {
        return await prisma.appointment.findMany({ orderBy: { createdAt: 'desc' } });
    },
    async findAppointmentByTime(date) {
        return await prisma.appointment.findFirst({ where: { time: date, status: { not: 'rejected' } } });
    },
    async createAppointment(data) {
        return await prisma.appointment.create({ data });
    },
    async updateAppointment(id, status) {
        return await prisma.appointment.update({ where: { id }, data: { status } });
    },
    async findAdmin(username) {
        return await prisma.admin.findUnique({ where: { username } });
    },
    async createAdmin(username, hash) {
        return await prisma.admin.create({ data: { username, password: hash } });
    },
    async usernameExists(username) {
        return !!(await prisma.admin.findUnique({ where: { username } }));
    }
};

// ─── HTTP Server + Socket.io ───
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'], credentials: true }
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
        try { socket.admin = jwt.verify(token, JWT_SECRET); } catch {}
    }
    next();
});

// ═══════════════════════════════
//          API ROUTES
// ═══════════════════════════════

// ─── GET Appointments (admin only) ───
app.get('/api/appointments', authMiddleware, async (req, res) => {
    try {
        res.json(await db.getAppointments());
    } catch (err) {
        console.error('[GET /api/appointments]', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ─── POST Appointment (public) ───
app.post('/api/appointments', appointmentLimiter, async (req, res) => {
    const { name, phone, service, time, website } = req.body;

    // Honeypot
    if (website) return res.status(201).json({ id: uuidv4(), status: 'pending' });

    if (!isValidName(name))
        return res.status(400).json({ error: 'Geçersiz isim. Sadece harf kullanın (2-50 karakter).' });

    if (!isValidPhone(phone))
        return res.status(400).json({ error: 'Geçersiz telefon. Format: 05xxxxxxxxx' });

    const date = new Date(time);
    if (isNaN(date.getTime()))
        return res.status(400).json({ error: 'Geçersiz tarih.' });

    if (date.getMinutes() % 30 !== 0 || date.getSeconds() !== 0)
        return res.status(400).json({ error: 'Geçersiz saat dilimi (00 veya 30 dakika olmalı).' });

    if (date < new Date())
        return res.status(400).json({ error: 'Geçmiş bir saat seçilemez.' });

    try {
        if (await db.findAppointmentByTime(date))
            return res.status(400).json({ error: 'Bu saat dilimi zaten rezerve edilmiş.' });

        const appt = await db.createAppointment({
            name: validator.escape(name.trim()),
            phone: phone.trim(),
            service: validator.escape((service || '').trim()),
            time: date,
        });

        io.emit('new_appointment', appt);
        res.status(201).json(appt);
    } catch (err) {
        console.error('[POST /api/appointments]', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ─── PATCH Appointment (admin only) ───
app.patch('/api/appointments/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status))
        return res.status(400).json({ error: 'Geçersiz durum.' });

    try {
        const updated = await db.updateAppointment(id, status);
        io.emit('appointment_updated', { id: updated.id, status: updated.status });
        res.json({ success: true });
    } catch (err) {
        console.error('[PATCH /api/appointments]', err);
        res.status(404).json({ error: 'Randevu bulunamadı.' });
    }
});

// ─── POST Admin Login ───
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

    try {
        const admin = await db.findAdmin(username);
        const DUMMY = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TUaudr/LQ/r/dJP5CbMDz7yK3HQm';
        const match = await bcrypt.compare(password, admin ? admin.password : DUMMY);

        if (!admin || !match)
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ success: true, token, username: admin.username });
    } catch (err) {
        console.error('[POST /api/admin/login]', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ─── POST Admin Register (protected) ───
app.post('/api/admin/register', authMiddleware, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter arasında olmalıdır.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });

    try {
        if (await db.usernameExists(username))
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });

        const hash = await bcrypt.hash(password, 12);
        const admin = await db.createAdmin(username, hash);
        res.status(201).json({ success: true, username: admin.username });
    } catch (err) {
        console.error('[POST /api/admin/register]', err);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// ─── GET Sound Files ───
app.get('/api/sounds', (req, res) => {
    const soundsDir = path.join(__dirname, '..', 'client', 'public', 'sounds');
    try {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
        const files = fs.readdirSync(soundsDir).filter(f =>
            audioExtensions.includes(path.extname(f).toLowerCase()) && !f.startsWith('.')
        );
        res.json({ files });
    } catch {
        res.json({ files: [] });
    }
});

// ─── Socket.io ───
io.on('connection', (socket) => {
    socket.on('disconnect', () => { });
});

// ─── Start ───
const PORT = process.env.PORT || 5000;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ SQLite bağlantısı kuruldu.');
    } catch (err) {
        console.error('❌ SQLite bağlanamadı:', err.message);
        process.exit(1);
    }
    
    server.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor.`));
}

main();
