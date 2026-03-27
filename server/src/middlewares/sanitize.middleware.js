const sanitizeHtml = require('sanitize-html');

function sanitizeValue(value) {
    if (typeof value === 'string') {
        // Strip HTML tags but do NOT escape HTML entities (preserve &, <, > in plain text)
        return value.replace(/<[^>]*>/g, '').trim();
    }
    return value;
}

function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            clean[key] = sanitizeValue(value);
        } else if (typeof value === 'object' && value !== null) {
            clean[key] = sanitizeObject(value);
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

const sanitizeMiddleware = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
};

module.exports = { sanitizeMiddleware, sanitizeValue };
