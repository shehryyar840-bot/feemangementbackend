const express = require('express');
const router = express.Router();
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignToClass,
  removeFromClass,
  getAssignedClasses,
  getMyClasses
} = require('../controllers/teacherController');
const { requireAuth, requireAdmin, requireTeacher } = require('../middleware/auth');

// Teacher can view their own classes
router.get('/my-classes', requireAuth, requireTeacher, getMyClasses);

// Admin only routes
router.get('/', requireAuth, requireAdmin, getAllTeachers);
router.get('/:id', requireAuth, requireAdmin, getTeacherById);
router.post('/', requireAuth, requireAdmin, createTeacher);
router.put('/:id', requireAuth, requireAdmin, updateTeacher);
router.delete('/:id', requireAuth, requireAdmin, deleteTeacher);

// Class assignment routes (Admin only)
router.post('/:id/assign-class', requireAuth, requireAdmin, assignToClass);
router.delete('/:id/remove-class/:classId', requireAuth, requireAdmin, removeFromClass);
router.get('/:id/classes', requireAuth, requireAdmin, getAssignedClasses);

module.exports = router;
