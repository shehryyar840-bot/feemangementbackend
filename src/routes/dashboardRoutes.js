const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMonthlyTrend,
  getClassWiseStats,
  getPaymentModeStats
} = require('../controllers/dashboardController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All dashboard routes - ADMIN ONLY (contains fee data)
router.get('/stats', requireAuth, requireAdmin, getDashboardStats);
router.get('/monthly-trend', requireAuth, requireAdmin, getMonthlyTrend);
router.get('/class-wise', requireAuth, requireAdmin, getClassWiseStats);
router.get('/payment-modes', requireAuth, requireAdmin, getPaymentModeStats);

module.exports = router;
