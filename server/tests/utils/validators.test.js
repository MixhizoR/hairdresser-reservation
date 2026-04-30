const { isValidName, isValidPhone, sanitizePhone } = require('../../src/utils/validators');

describe('Validators', () => {
    describe('isValidName', () => {
        it('should allow valid names with spaces and &', () => {
            expect(isValidName('Jack Jill')).toBe(true);
            expect(isValidName('Jack & Jill')).toBe(true);
            expect(isValidName('Saç & Sakal Kesimi')).toBe(true);
        });

        it('should allow Turkish characters', () => {
            expect(isValidName('Ömer Çağrı')).toBe(true);
            expect(isValidName('Gülşen Şen')).toBe(true);
        });

        it('should reject names with other special characters', () => {
            expect(isValidName('Jack! Jill')).toBe(false);
            expect(isValidName('Jack<Jill>')).toBe(false);
            expect(isValidName('Jack"Jill"')).toBe(false);
        });

        it('should reject names that are too short or too long', () => {
            expect(isValidName('A')).toBe(false);
            expect(isValidName('A'.repeat(51))).toBe(false);
        });

        it('should handle empty or null input', () => {
            expect(isValidName('')).toBe(false);
            expect(isValidName(null)).toBe(false);
            expect(isValidName(undefined)).toBe(false);
        });
    });

    describe('isValidPhone', () => {
        it('should allow valid phone numbers starting with 05', () => {
            expect(isValidPhone('05321234567')).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(isValidPhone('1234567890')).toBe(false);
            expect(isValidPhone('0532123456')).toBe(false); // too short
            expect(isValidPhone('053212345678')).toBe(false); // too long
            expect(isValidPhone('06321234567')).toBe(false); // wrong prefix
        });

        it('should accept international +90 format', () => {
            expect(isValidPhone('+90 532 123 45 67')).toBe(true);
            expect(isValidPhone('+905321234567')).toBe(true);
        });

        it('should accept 90 prefix format', () => {
            expect(isValidPhone('905321234567')).toBe(true);
        });

        it('should accept 0090 prefix format', () => {
            expect(isValidPhone('00905321234567')).toBe(true);
        });
    });

    describe('sanitizePhone', () => {
        it('should remove non-digit characters', () => {
            expect(sanitizePhone('0532 123 45 67')).toBe('05321234567');
            expect(sanitizePhone('(0532) 123-45-67')).toBe('05321234567');
        });

        it('should strip +90 country code', () => {
            expect(sanitizePhone('+90 532 123 45 67')).toBe('05321234567');
            expect(sanitizePhone('+905321234567')).toBe('05321234567');
        });

        it('should strip 90 prefix (12 digits)', () => {
            expect(sanitizePhone('905321234567')).toBe('05321234567');
        });

        it('should strip 0090 country code', () => {
            expect(sanitizePhone('00905321234567')).toBe('05321234567');
        });

        it('should return 05-prefixed number unchanged', () => {
            expect(sanitizePhone('05321234567')).toBe('05321234567');
        });

        it('should return empty string for non-string input', () => {
            expect(sanitizePhone(null)).toBe('');
            expect(sanitizePhone(undefined)).toBe('');
            expect(sanitizePhone(12345)).toBe('');
        });
    });
});
