const sanitizeHtml = require('sanitize-html');

function sanitizeValue(value) {
    if (typeof value === 'string') {
        // First use sanitize-html to strip tags, then decode entities
        const withoutTags = sanitizeHtml(value, {
            allowedTags: [],        // strip ALL HTML tags
            allowedAttributes: {},  // strip ALL attributes
            disallowedTagsMode: 'discard',
            textFilter: function(text) {
                return text; // preserve text content including special chars
            }
        });
        // Decode HTML entities to preserve original characters
        return withoutTags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
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
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }
    next();
};

module.exports = { sanitizeMiddleware, sanitizeValue };
