const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'uploads');

// Barber photo upload config
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fs = require('fs');
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(8).toString('hex') + ext;
        cb(null, name);
    },
});

const ALLOWED_PHOTO_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];

const photoUpload = multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_PHOTO_TYPES.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece JPG, PNG ve WebP dosyaları yüklenebilir.'));
        }
    },
});

// Sound upload config - strict whitelist: .mp3 and .wav only
const SOUNDS_DIR = path.join(__dirname, '..', '..', '..', 'client', 'public', 'sounds');

const soundStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fs = require('fs');
        if (!fs.existsSync(SOUNDS_DIR)) fs.mkdirSync(SOUNDS_DIR, { recursive: true });
        cb(null, SOUNDS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = crypto.randomBytes(8).toString('hex') + ext;
        cb(null, name);
    },
});

const ALLOWED_SOUND_TYPES = ['.mp3', '.wav'];

const soundUpload = multer({
    storage: soundStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_SOUND_TYPES.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece MP3 ve WAV dosyaları yüklenebilir.'));
        }
    },
});

module.exports = { photoUpload, soundUpload };
