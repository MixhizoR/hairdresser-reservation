const fs = require('fs');
const path = require('path');
const db = require('../services/db.service');
const { log } = require('../config/logger');

const SOUNDS_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'sounds');
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/* ──────────────────────────────────────────────────────────────
   API Contract:
   GET    /api/notification-sound        → Get user's current preference
   POST   /api/notification-sound        → Save/update preference
   POST   /api/notification-sound/upload → Upload new sound file
   PUT    /api/notification-sound        → Update preference only
   DELETE /api/notification-sound/:filename → Delete uploaded sound
   ────────────────────────────────────────────────────────────── */

// GET /api/notification-sound — get current user's notification sound preference
const getNotificationSound = async (req, res) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

        // Also list available sounds
        let files = [];
        try {
            if (!fs.existsSync(SOUNDS_DIR)) {
                fs.mkdirSync(SOUNDS_DIR, { recursive: true });
            }
            files = fs.readdirSync(SOUNDS_DIR).filter(f => {
                const ext = path.extname(f).toLowerCase();
                return ALLOWED_AUDIO_EXTENSIONS.includes(ext) && !f.startsWith('.');
            });
        } catch {}

        res.json({
            currentSound: user.notificationSoundName || null,
            currentSoundUrl: user.notificationSoundUrl || null,
            files,
        });
    } catch (err) {
        log('error', 'GET /api/notification-sound failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// POST /api/notification-sound — save/update user's notification sound preference
const saveNotificationSound = async (req, res) => {
    const { soundName, soundUrl } = req.body;

    if (!soundName) {
        return res.status(400).json({ error: 'Ses dosyası adı gerekli.' });
    }

    try {
        // Validate the sound file exists
        const ext = path.extname(soundName).toLowerCase();
        if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
            return res.status(400).json({ error: 'Geçersiz ses dosyası formatı.' });
        }

        // Prevent path traversal
        if (soundName.includes('..') || soundName.includes('/') || soundName.includes('\\')) {
            return res.status(400).json({ error: 'Geçersiz dosya adı.' });
        }

        const filePath = path.join(SOUNDS_DIR, soundName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Ses dosyası bulunamadı.' });
        }

        // Persist to user profile (server-side)
        const url = soundUrl || `/sounds/${soundName}`;
        await db.updateUser(req.user.id, {
            notificationSoundUrl: url,
            notificationSoundName: soundName,
        });

        res.json({
            success: true,
            soundName,
            soundUrl: url,
            message: 'Bildirim sesi tercihi kaydedildi.',
        });
    } catch (err) {
        log('error', 'POST /api/notification-sound failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// PUT /api/notification-sound — update preference only
const updateNotificationSound = async (req, res) => {
    const { soundName, soundUrl } = req.body;

    try {
        if (soundName === null || soundName === '') {
            // Reset to default
            await db.updateUser(req.user.id, {
                notificationSoundUrl: null,
                notificationSoundName: null,
            });
            return res.json({
                success: true,
                soundName: null,
                soundUrl: null,
                message: 'Bildirim sesi sıfırlandı. Varsayılan ses kullanılacak.',
            });
        }

        if (!soundName) {
            return res.status(400).json({ error: 'Ses dosyası adı gerekli.' });
        }

        // Validate
        const ext = path.extname(soundName).toLowerCase();
        if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
            return res.status(400).json({ error: 'Geçersiz ses dosyası formatı.' });
        }

        if (soundName.includes('..') || soundName.includes('/') || soundName.includes('\\')) {
            return res.status(400).json({ error: 'Geçersiz dosya adı.' });
        }

        const url = soundUrl || `/sounds/${soundName}`;
        await db.updateUser(req.user.id, {
            notificationSoundUrl: url,
            notificationSoundName: soundName,
        });

        res.json({
            success: true,
            soundName,
            soundUrl: url,
            message: 'Bildirim sesi tercihi güncellendi.',
        });
    } catch (err) {
        log('error', 'PUT /api/notification-sound failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// POST /api/notification-sound/upload — upload new sound file
const uploadNotificationSound = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    // Strict extension validation
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Sadece MP3 ve WAV dosyaları yüklenebilir.' });
    }

    // Size validation (multer limit is set in middleware, but double-check)
    if (req.file.size > MAX_FILE_SIZE) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Dosya boyutu 5MB\'ı aşamaz.' });
    }

    // MIME validation
    const allowedMime = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mp3'];
    if (req.file.mimetype && !allowedMime.includes(req.file.mimetype) && !req.file.mimetype.startsWith('audio/')) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Geçersiz dosya türü. Sadece ses dosyaları kabul edilir.' });
    }

    res.status(201).json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        message: 'Ses dosyası yüklendi.',
    });
};

// DELETE /api/notification-sound/:filename — delete uploaded sound
const deleteNotificationSound = async (req, res) => {
    const { filename } = req.params;

    // Whitelist validation
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ error: 'Geçersiz dosya uzantısı.' });
    }

    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Geçersiz dosya adı.' });
    }

    const filePath = path.join(SOUNDS_DIR, filename);

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı.' });
        }
        fs.unlinkSync(filePath);

        // Clear user preference if this was their selected sound
        const user = await db.findUserById(req.user.id);
        if (user && user.notificationSoundName === filename) {
            await db.updateUser(req.user.id, {
                notificationSoundUrl: null,
                notificationSoundName: null,
            });
        }

        res.json({ success: true, message: 'Ses dosyası silindi.' });
    } catch (err) {
        log('error', 'DELETE /api/notification-sound/:filename failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    getNotificationSound,
    saveNotificationSound,
    updateNotificationSound,
    uploadNotificationSound,
    deleteNotificationSound,
};
