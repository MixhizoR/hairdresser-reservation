const fs = require('fs');
const path = require('path');
const { log } = require('../config/logger');

const SOUNDS_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'sounds');

// Strict whitelist: only .mp3 and .wav
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav'];

// GET /api/sounds — list available sounds
const getSounds = (req, res) => {
    try {
        if (!fs.existsSync(SOUNDS_DIR)) {
            fs.mkdirSync(SOUNDS_DIR, { recursive: true });
        }
        const files = fs.readdirSync(SOUNDS_DIR).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ALLOWED_AUDIO_EXTENSIONS.includes(ext) && !f.startsWith('.');
        });
        res.json({ files });
    } catch {
        res.json({ files: [] });
    }
};

// POST /api/sounds/upload — admin only
const uploadSound = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    // Strict extension validation
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
        // Remove the uploaded file if extension doesn't match
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Sadece MP3 ve WAV dosyaları yüklenebilir.' });
    }

    res.status(201).json({
        success: true,
        filename: req.file.filename,
        message: 'Ses dosyası yüklendi.',
    });
};

// DELETE /api/sounds/:filename — admin only
const deleteSound = (req, res) => {
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
        res.json({ success: true, message: 'Ses dosyası silindi.' });
    } catch (err) {
        log('error', 'DELETE /api/sounds/:filename failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    getSounds,
    uploadSound,
    deleteSound,
};
