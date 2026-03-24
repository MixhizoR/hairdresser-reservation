const { appointmentLimiter, trackLimiter } = require('./rateLimit.middleware');

describe('rateLimit middleware', () => {
  it('should have appointmentLimiter defined', () => {
    expect(appointmentLimiter).toBeDefined();
  });

  it('should have trackLimiter defined', () => {
    expect(trackLimiter).toBeDefined();
  });
});
