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

// Warn in development if using defaults
if (!isDev && JWT_SECRET === 'dev-secret-change-in-production') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Change this before going to production!');
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
