require('dotenv').config();

// Fail fast if required env variables are missing in production
if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGIN'];
  required.forEach(key => {
    if (!process.env[key]) {
      throw new Error(`FATAL: Missing required environment variable: ${key}`);
    }
  });
}

const isDev = process.env.NODE_ENV === 'development';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Warn when using default JWT_SECRET (in both dev and production)
if (JWT_SECRET === 'dev-secret-change-in-production') {
  if (isDev) {
    console.warn('⚠️  [DEV] Using default JWT_SECRET. Set JWT_SECRET in your .env file.');
  } else {
    console.error('🚨 FATAL: Using default JWT_SECRET in non-development environment!');
    // Do not throw — this is already caught by the production required-var check above
  }
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const PORT = process.env.PORT || 5000;

module.exports = {
    isDev,
    ALLOWED_ORIGIN,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    PORT,
};
