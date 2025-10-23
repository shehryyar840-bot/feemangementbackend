const express = require('express');
const router = express.Router();
const {
  getAllFeeStructures,
  getFeeStructureByClassId,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
} = require('../controllers/feeStructureController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All fee structure routes - ADMIN ONLY (teachers cannot view fees)
router.get('/', requireAuth, requireAdmin, getAllFeeStructures);
router.get('/class/:classId', requireAuth, requireAdmin, getFeeStructureByClassId);
router.post('/', requireAuth, requireAdmin, createFeeStructure);
router.put('/:id', requireAuth, requireAdmin, updateFeeStructure);
router.delete('/:id', requireAuth, requireAdmin, deleteFeeStructure);

module.exports = router;
