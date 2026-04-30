// Sanitize phone number: remove non-digits, strip country code, ensure 05 prefix
const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') return '';

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle international formats: +90, 90, 0090
    if (cleaned.startsWith('0090')) {
        cleaned = '0' + cleaned.slice(4);
    } else if (cleaned.startsWith('90') && cleaned.length === 12) {
        // 905321234567 -> 05321234567
        cleaned = '0' + cleaned.slice(2);
    }

    return cleaned;
};

// Validate sanitized phone: must be 11 digits starting with 05
const isValidPhone = (phone) => {
    const cleaned = sanitizePhone(phone);
    return /^05\d{9}$/.test(cleaned);
};

const isValidName = (name) => {
    const t = name?.trim() || '';
    return t.length >= 2 && t.length <= 50 && /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s&]+$/.test(t);
};

module.exports = {
    isValidPhone,
    isValidName,
    sanitizePhone,
};
