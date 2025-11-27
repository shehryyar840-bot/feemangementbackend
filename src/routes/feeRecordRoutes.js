const express = require('express');
const router = express.Router();
const {
  getAllFeeRecords,
  getFeeRecordById,
  recordPayment,
  updateFeeRecordStatus,
  updateOverdueStatus,
  getOverdueFeeRecords,
  getPendingFeeRecords,
  generateMonthlyFeeRecords,
  addOneTimeFees
} = require('../controllers/feeRecordController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All fee record routes - ADMIN ONLY (teachers cannot view fees)
router.get('/', requireAuth, requireAdmin, getAllFeeRecords);
router.get('/overdue', requireAuth, requireAdmin, getOverdueFeeRecords);
router.get('/pending', requireAuth, requireAdmin, getPendingFeeRecords);
router.get('/:id', requireAuth, requireAdmin, getFeeRecordById);

// Generate monthly fee records for students
router.post('/generate', requireAuth, requireAdmin, generateMonthlyFeeRecords);

// Add one-time fees to an existing record
router.post('/:id/add-fees', requireAuth, requireAdmin, addOneTimeFees);

// Payment and status updates
router.post('/:id/payment', requireAuth, requireAdmin, recordPayment);
router.put('/:id/status', requireAuth, requireAdmin, updateFeeRecordStatus);
router.post('/update-overdue', requireAuth, requireAdmin, updateOverdueStatus);

module.exports = router;
