/**
 * Generate 30-minute time slots within configured working hours.
 *
 * @param {Object} config - Day config { open: "HH:MM", close: "HH:MM", closed: boolean }
 * @returns {string[]} Array of "HH:MM" slots in 24-hour format
 */
function generateTimeSlots(config) {
    if (!config || config.closed) return [];

    const open = '08:00';
    const close = '21:00';

    const [openH, openM] = open.split(':').map(Number);
    const [closeH, closeM] = close.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (closeMinutes <= openMinutes) return [];

    const slots = [];
    for (let t = openMinutes; t < closeMinutes; t += 30) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return slots;
}

/**
 * Parse a "HH:MM" string to total minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return h * 60 + m;
}

/**
 * Format total minutes from midnight to "HH:MM" in 24-hour format.
 */
function formatMinutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = { generateTimeSlots, parseTimeToMinutes, formatMinutesToTime };
