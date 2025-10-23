const jwt = require('jsonwebtoken');

// Secret key for JWT (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY
  });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
