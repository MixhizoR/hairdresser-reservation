require('dotenv').config();

const isDev = process.env.NODE_ENV === 'development';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const PORT = process.env.PORT || 5000;

module.exports = {
    isDev,
    ALLOWED_ORIGIN,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    PORT,
};
