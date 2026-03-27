const { sanitizeValue, sanitizeMiddleware } = require('../../src/middlewares/sanitize.middleware');

describe('Sanitize Middleware', () => {
    // ==================== sanitizeValue ====================
    describe('sanitizeValue', () => {
        it('should strip HTML tags from strings', () => {
            expect(sanitizeValue('<script>alert("xss")</script>')).toBe('alert("xss")');
            expect(sanitizeValue('<b>bold</b>')).toBe('bold');
            expect(sanitizeValue('<div class="test">content</div>')).toBe('content');
        });

        it('should strip nested HTML tags', () => {
            expect(sanitizeValue('<div><span>nested</span></div>')).toBe('nested');
        });

        it('should strip self-closing tags', () => {
            expect(sanitizeValue('line1<br/>line2')).toBe('line1line2');
            expect(sanitizeValue('before<hr/>after')).toBe('beforeafter');
        });

        it('should trim whitespace', () => {
            expect(sanitizeValue('  hello  ')).toBe('hello');
            expect(sanitizeValue('  <b>hello</b>  ')).toBe('hello');
        });

        it('should preserve plain text', () => {
            expect(sanitizeValue('Jack & Jill')).toBe('Jack & Jill');
            expect(sanitizeValue('Saç Kesimi')).toBe('Saç Kesimi');
            expect(sanitizeValue('Hello World')).toBe('Hello World');
        });

        it('should return non-string values unchanged', () => {
            expect(sanitizeValue(42)).toBe(42);
            expect(sanitizeValue(true)).toBe(true);
            expect(sanitizeValue(null)).toBe(null);
            expect(sanitizeValue(undefined)).toBe(undefined);
        });

        it('should handle empty string', () => {
            expect(sanitizeValue('')).toBe('');
        });
    });

    // ==================== sanitizeMiddleware ====================
    describe('sanitizeMiddleware', () => {
        let req, res, next;

        beforeEach(() => {
            res = {};
            next = jest.fn();
        });

        it('should sanitize string values in req.body', () => {
            req = {
                body: { name: '<script>alert("xss")</script>John', phone: '05321234567' },
                query: {}
            };

            sanitizeMiddleware(req, res, next);

            expect(req.body.name).toBe('alert("xss")John');
            expect(req.body.phone).toBe('05321234567');
            expect(next).toHaveBeenCalled();
        });

        it('should sanitize string values in req.query', () => {
            req = {
                body: {},
                query: { code: '<b>TEST</b>' }
            };

            sanitizeMiddleware(req, res, next);

            expect(req.query.code).toBe('TEST');
            expect(next).toHaveBeenCalled();
        });

        it('should sanitize nested objects', () => {
            req = {
                body: {
                    user: {
                        name: '<em>Test</em>',
                        age: 25
                    }
                },
                query: {}
            };

            sanitizeMiddleware(req, res, next);

            expect(req.body.user.name).toBe('Test');
            expect(req.body.user.age).toBe(25);
        });

        it('should sanitize arrays', () => {
            req = {
                body: {
                    tags: ['<b>tag1</b>', 'tag2']
                },
                query: {}
            };

            sanitizeMiddleware(req, res, next);

            expect(req.body.tags[0]).toBe('tag1');
            expect(req.body.tags[1]).toBe('tag2');
        });

        it('should preserve non-string primitive values', () => {
            req = {
                body: { count: 10, active: true, price: null },
                query: {}
            };

            sanitizeMiddleware(req, res, next);

            expect(req.body.count).toBe(10);
            expect(req.body.active).toBe(true);
            expect(req.body.price).toBe(null);
        });

        it('should call next', () => {
            req = { body: {}, query: {} };

            sanitizeMiddleware(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });

        it('should handle undefined body', () => {
            req = { query: {} };

            sanitizeMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should handle undefined query', () => {
            req = { body: {} };

            sanitizeMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
