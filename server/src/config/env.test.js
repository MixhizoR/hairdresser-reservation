jest.mock('dotenv', () => ({
  config: jest.fn(() => ({ error: null }))
}));

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear variables that might be set in .env to test defaults
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.ALLOWED_ORIGIN;
    delete process.env.PORT;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw error if required production env vars are missing', () => {
    process.env.NODE_ENV = 'production';
    
    expect(() => {
      // In production, require('./env') should throw if vars are missing
      // We must re-require it to trigger the side effect
      require('./env');
    }).toThrow();
  });

  it('should use default values in development', () => {
    process.env.NODE_ENV = 'development';

    const env = require('./env');
    expect(env.isDev).toBe(true);
    expect(env.ALLOWED_ORIGIN).toBe('http://localhost:5173');
    expect(env.JWT_SECRET).toBe('dev-secret-change-in-production');
    expect(env.PORT).toBe(5000);
  });
});
