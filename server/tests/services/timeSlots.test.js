const { generateTimeSlots, parseTimeToMinutes, formatMinutesToTime } = require('../../src/utils/timeSlots');

describe('Time Slot Generation', () => {
    describe('generateTimeSlots', () => {
        it('should generate 30-minute slots from 08:00 to 20:30 (hardcoded hours)', () => {
            const config = { open: '09:00', close: '20:00', closed: false };
            const slots = generateTimeSlots(config);

            // Hardcoded to 08:00-21:00, so config is ignored
            expect(slots.length).toBe(26); // 08:00 .. 20:30 inclusive
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('20:30');
        });

        it('should not include the close time itself (21:00)', () => {
            const config = { open: '08:00', close: '21:00', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots).not.toContain('21:00');
        });

        it('should return empty array for closed days', () => {
            const config = { open: '08:00', close: '21:00', closed: true };
            const slots = generateTimeSlots(config);

            // When closed: true, returns empty regardless of times
            expect(slots).toEqual([]);
        });

        it('should return empty array for null config', () => {
            expect(generateTimeSlots(null)).toEqual([]);
            expect(generateTimeSlots(undefined)).toEqual([]);
        });

        it('should return hardcoded 08:00-20:30 slots regardless of config window', () => {
            const config = { open: '09:00', close: '10:00', closed: false };
            const slots = generateTimeSlots(config);

            // Config is ignored, always returns 08:00-20:30
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('20:30');
        });

        it('should return full hardcoded slots even with 30-min config window', () => {
            const config = { open: '09:00', close: '09:30', closed: false };
            const slots = generateTimeSlots(config);

            // Config is ignored, always returns 08:00-20:30
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
        });

        it('should return hardcoded slots even when close equals open in config', () => {
            const config = { open: '09:00', close: '09:00', closed: false };
            const slots = generateTimeSlots(config);
            // Config is ignored
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
        });

        it('should return hardcoded slots even when close is before open in config', () => {
            const config = { open: '18:00', close: '09:00', closed: false };
            const slots = generateTimeSlots(config);
            // Config is ignored
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
        });

        it('should return full day hardcoded slots (08:00-20:30)', () => {
            const config = { open: '08:00', close: '13:00', closed: false };
            const slots = generateTimeSlots(config);

            // Config is ignored, always returns full 08:00-20:30
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('20:30');
        });

        it('should produce slots in 24-hour format (no AM/PM)', () => {
            const config = { open: '13:00', close: '16:00', closed: false };
            const slots = generateTimeSlots(config);

            slots.forEach(slot => {
                // Must match HH:MM format
                expect(slot).toMatch(/^\d{2}:\d{2}$/);
                const [h, m] = slot.split(':').map(Number);
                expect(h).toBeGreaterThanOrEqual(0);
                expect(h).toBeLessThanOrEqual(23);
                expect([0, 30]).toContain(m);
            });

            // Hardcoded 08:00-20:30, so 13:00 and 15:30 should be present
            expect(slots).toContain('13:00');
            expect(slots).toContain('15:30');
            expect(slots).not.toContain('1:00 PM');
            expect(slots).not.toContain('01:00 PM');
        });

        it('should return hardcoded 08:00-20:30 even for late evening config', () => {
            const config = { open: '20:00', close: '23:00', closed: false };
            const slots = generateTimeSlots(config);

            // Config is ignored, returns 08:00-20:30 (21:00 is closing, not included)
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('20:30');
        });

        it('should return hardcoded slots even for midnight-crossing config', () => {
            const config = { open: '22:00', close: '02:00', closed: false };
            const slots = generateTimeSlots(config);
            // Config is ignored
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
        });

        it('should return hardcoded 08:00-20:30 when no open/close provided', () => {
            const config = { closed: false };
            const slots = generateTimeSlots(config);

            // Config is ignored, returns hardcoded 08:00-20:30
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('20:30');
        });

        it('should return hardcoded slots even for non-standard boundaries', () => {
            const config = { open: '09:30', close: '11:30', closed: false };
            const slots = generateTimeSlots(config);

            // Config is ignored
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('20:30');
        });

        it('should generate 26 slots for hardcoded 08:00-21:00', () => {
            const config = { open: '09:00', close: '20:00', closed: false };
            const slots = generateTimeSlots(config);

            // Hardcoded 08:00-21:00 = (21-8)*2 = 26 slots (08:00 .. 20:30)
            expect(slots.length).toBe(26);
        });

        it('should return full hardcoded slots even for 15-minute config window', () => {
            const config = { open: '09:00', close: '09:15', closed: false };
            const slots = generateTimeSlots(config);
            // Config is ignored
            expect(slots.length).toBe(26);
            expect(slots[0]).toBe('08:00');
        });
    });

    describe('parseTimeToMinutes', () => {
        it('should parse "09:00" to 540', () => {
            expect(parseTimeToMinutes('09:00')).toBe(540);
        });

        it('should parse "00:00" to 0', () => {
            expect(parseTimeToMinutes('00:00')).toBe(0);
        });

        it('should parse "23:59" to 1439', () => {
            expect(parseTimeToMinutes('23:59')).toBe(1439);
        });

        it('should parse "12:30" to 750', () => {
            expect(parseTimeToMinutes('12:30')).toBe(750);
        });

        it('should return 0 for null/undefined input', () => {
            expect(parseTimeToMinutes(null)).toBe(0);
            expect(parseTimeToMinutes(undefined)).toBe(0);
        });
    });

    describe('formatMinutesToTime', () => {
        it('should format 540 to "09:00"', () => {
            expect(formatMinutesToTime(540)).toBe('09:00');
        });

        it('should format 0 to "00:00"', () => {
            expect(formatMinutesToTime(0)).toBe('00:00');
        });

        it('should format 1439 to "23:59"', () => {
            expect(formatMinutesToTime(1439)).toBe('23:59');
        });

        it('should format 750 to "12:30"', () => {
            expect(formatMinutesToTime(750)).toBe('12:30');
        });
    });
});
