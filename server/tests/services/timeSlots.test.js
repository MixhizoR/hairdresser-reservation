const { generateTimeSlots, parseTimeToMinutes, formatMinutesToTime } = require('../../src/utils/timeSlots');

describe('Time Slot Generation', () => {
    describe('generateTimeSlots', () => {
        it('should generate 30-minute slots from 09:00 to 19:30 for 09:00-20:00', () => {
            const config = { open: '09:00', close: '20:00', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots.length).toBe(22); // 09:00 .. 19:30 inclusive
            expect(slots[0]).toBe('09:00');
            expect(slots[slots.length - 1]).toBe('19:30');
        });

        it('should not include the close time itself', () => {
            const config = { open: '09:00', close: '20:00', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots).not.toContain('20:00');
        });

        it('should return empty array for closed days', () => {
            const config = { open: '09:00', close: '18:00', closed: true };
            const slots = generateTimeSlots(config);

            expect(slots).toEqual([]);
        });

        it('should return empty array for null config', () => {
            expect(generateTimeSlots(null)).toEqual([]);
            expect(generateTimeSlots(undefined)).toEqual([]);
        });

        it('should handle a 1-hour window (09:00-10:00)', () => {
            const config = { open: '09:00', close: '10:00', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots).toEqual(['09:00', '09:30']);
        });

        it('should handle edge case where open and close are 30 minutes apart', () => {
            const config = { open: '09:00', close: '09:30', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots).toEqual(['09:00']);
        });

        it('should return empty if close equals open', () => {
            const config = { open: '09:00', close: '09:00', closed: false };
            expect(generateTimeSlots(config)).toEqual([]);
        });

        it('should return empty if close is before open', () => {
            const config = { open: '18:00', close: '09:00', closed: false };
            expect(generateTimeSlots(config)).toEqual([]);
        });

        it('should generate slots from 08:00 to 12:30 for half-day morning', () => {
            const config = { open: '08:00', close: '13:00', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots.length).toBe(10);
            expect(slots[0]).toBe('08:00');
            expect(slots[slots.length - 1]).toBe('12:30');
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

            // Verify 24-hour times are used
            expect(slots).toContain('13:00');
            expect(slots).toContain('15:30');
            expect(slots).not.toContain('1:00 PM');
            expect(slots).not.toContain('01:00 PM');
        });

        it('should handle late evening hours (20:00-23:00)', () => {
            const config = { open: '20:00', close: '23:00', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots).toEqual(['20:00', '20:30', '21:00', '21:30', '22:00', '22:30']);
        });

        it('should handle midnight-crossing not supported (return empty)', () => {
            const config = { open: '22:00', close: '02:00', closed: false };
            const slots = generateTimeSlots(config);
            expect(slots).toEqual([]);
        });

        it('should default open to 09:00 and close to 20:00 when not provided', () => {
            const config = { closed: false };
            const slots = generateTimeSlots(config);

            expect(slots[0]).toBe('09:00');
            expect(slots[slots.length - 1]).toBe('19:30');
        });

        it('should handle non-standard 30-minute open boundaries (e.g. 09:30-11:30)', () => {
            const config = { open: '09:30', close: '11:30', closed: false };
            const slots = generateTimeSlots(config);

            expect(slots).toEqual(['09:30', '10:00', '10:30', '11:00']);
        });

        it('should generate the correct number of slots for a full day', () => {
            const config = { open: '09:00', close: '20:00', closed: false };
            const slots = generateTimeSlots(config);

            // (20*60 - 9*60) / 30 = 11*60/30 = 22 slots
            expect(slots.length).toBe(22);
        });

        it('should generate one slot for a 15-minute window (09:00-09:15)', () => {
            const config = { open: '09:00', close: '09:15', closed: false };
            const slots = generateTimeSlots(config);
            // 09:00 is a valid start; next slot at 09:30 >= 09:15 so it stops
            expect(slots).toEqual(['09:00']);
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
