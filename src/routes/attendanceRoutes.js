const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getClassAttendance,
  markAttendance,
  bulkMarkAttendance,
  getStudentAttendanceSummary,
  getClassAttendanceReport,
  deleteAttendance
} = require('../controllers/attendanceController');
const { requireAuth, requireAdminOrTeacher, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Get all attendance records (with filters)
router.get('/', requireAdminOrTeacher, getAllAttendance);

// Get class attendance for specific date
router.get('/class/:classId/date/:date', requireAdminOrTeacher, getClassAttendance);

// Get class attendance report (date range)
router.get('/class/:classId/report', requireAdminOrTeacher, getClassAttendanceReport);

// Get student attendance summary
router.get('/student/:studentId/summary', requireAdminOrTeacher, getStudentAttendanceSummary);

// Mark attendance (single)
router.post('/mark', requireAdminOrTeacher, markAttendance);

// Bulk mark attendance
router.post('/bulk-mark', requireAdminOrTeacher, bulkMarkAttendance);

// Delete attendance record (admin only)
router.delete('/:id', requireAdmin, deleteAttendance);

module.exports = router;
