const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.post('/change-password', requireAuth, changePassword);

// Admin only routes
router.post('/register', requireAuth, requireAdmin, register);

module.exports = router;
