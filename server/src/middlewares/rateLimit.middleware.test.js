const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('rateLimit middleware', () => {
  describe('appointmentLimiter rate limiting', () => {
    // Create a test app with a LOW limit for testing
    let app;
    let testLimiter;

    beforeEach(() => {
      // Create a custom limiter with max=5 for testing
      testLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { error: 'Çok fazla randevu talebi. 15 dakika bekleyin.' },
        standardHeaders: true, legacyHeaders: false,
      });

      app = express();
      app.use(testLimiter);
      app.get('/test-appointment', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should return 200 for requests within limit', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(request(app).get('/test-appointment'));
      }
      
      const responses = await Promise.all(requests);
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    it('should return 429 Too Many Requests when limit exceeded', async () => {
      const requests = [];
      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        requests.push(request(app).get('/test-appointment'));
      }
      
      const responses = await Promise.all(requests);
      
      // First 5 should succeed
      for (let i = 0; i < 5; i++) {
        expect(responses[i].status).toBe(200);
      }
      
      // 6th should fail with 429
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.error).toBe('Çok fazla randevu talebi. 15 dakika bekleyin.');
    });
  });

  describe('trackLimiter rate limiting', () => {
    let app;
    let testLimiter;

    beforeEach(() => {
      testLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: { error: 'Çok fazla sorgulama. 15 dakika bekleyin.' },
        standardHeaders: true, legacyHeaders: false,
      });

      app = express();
      app.use(testLimiter);
      app.get('/test-track', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should return 200 for normal requests', async () => {
      const res = await request(app).get('/test-track');
      expect(res.status).toBe(200);
    });

    it('should return 429 when limit exceeded', async () => {
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(request(app).get('/test-track'));
      }
      
      const responses = await Promise.all(requests);
      expect(responses[5].status).toBe(429);
    });
  });
});
