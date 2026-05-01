const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'uploads');
const SOUNDS_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'sounds');

// Ensure upload directories exist at startup (not per-request)
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(SOUNDS_DIR, { recursive: true });

// Barber photo upload config
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(8).toString('hex') + ext;
        cb(null, name);
    },
});

const ALLOWED_PHOTO_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const photoUpload = multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        // Reject null byte injection attempts
        if (file.originalname.includes('\0') || file.originalname.includes('%00')) {
            return cb(new Error('Invalid filename'));
        }
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_PHOTO_TYPES.includes(ext) && ALLOWED_PHOTO_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece JPG, PNG ve WebP dosyaları yüklenebilir.'));
        }
    },
});

// Sound upload config - strict whitelist: .mp3 and .wav only
const soundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, SOUNDS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(8).toString('hex') + ext;
        cb(null, name);
    },
});

const ALLOWED_SOUND_TYPES = ['.mp3', '.wav'];
const ALLOWED_SOUND_MIMES = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav'];

const soundUpload = multer({
    storage: soundStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        // Reject null byte injection attempts
        if (file.originalname.includes('\0') || file.originalname.includes('%00')) {
            return cb(new Error('Invalid filename'));
        }
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_SOUND_TYPES.includes(ext) && ALLOWED_SOUND_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece MP3 ve WAV dosyaları yüklenebilir.'));
        }
    },
});

module.exports = { photoUpload, soundUpload };
