const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/classController');
const { requireAuth, requireAdmin, requireAdminOrTeacher } = require('../middleware/auth');

// Viewing classes - both admin and teacher can view
router.get('/', requireAuth, requireAdminOrTeacher, getAllClasses);
router.get('/:id', requireAuth, requireAdminOrTeacher, getClassById);

// Managing classes - admin only
router.post('/', requireAuth, requireAdmin, createClass);
router.put('/:id', requireAuth, requireAdmin, updateClass);
router.delete('/:id', requireAuth, requireAdmin, deleteClass);

module.exports = router;
