const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  permanentDeleteStudent
} = require('../controllers/studentController');
const { requireAuth, requireAdmin, requireAdminOrTeacher } = require('../middleware/auth');

// Viewing students - both admin and teacher can view
router.get('/', requireAuth, requireAdminOrTeacher, getAllStudents);
router.get('/:id', requireAuth, requireAdminOrTeacher, getStudentById);

// Managing students - admin only
router.post('/', requireAuth, requireAdmin, createStudent);
router.put('/:id', requireAuth, requireAdmin, updateStudent);
router.delete('/:id', requireAuth, requireAdmin, deleteStudent);
router.delete('/:id/permanent', requireAuth, requireAdmin, permanentDeleteStudent);

module.exports = router;
