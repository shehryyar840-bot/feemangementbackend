const prisma = require('../utils/prisma');

// Get all attendance records with filters
const getAllAttendance = async (req, res) => {
  try {
    const { classId, studentId, date, status, startDate, endDate } = req.query;

    const where = {};

    // Filter by student
    if (studentId) {
      where.studentId = parseInt(studentId);
    }

    // Filter by class (via student)
    if (classId) {
      where.student = {
        classId: parseInt(classId)
      };
    }

    // Filter by specific date
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.date = {
        gte: searchDate,
        lt: nextDay
      };
    }

    // Filter by date range
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            class: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { student: { name: 'asc' } }
      ]
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get attendance for a specific class and date
const getClassAttendance = async (req, res) => {
  try {
    const { classId, date } = req.params;

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: parseInt(classId),
        isActive: true
      },
      include: {
        attendances: {
          where: {
            date: {
              gte: searchDate,
              lt: nextDay
            }
          }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark attendance (single student)
const markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        error: 'Student ID, date, and status are required'
      });
    }

    // Verify teacher has permission (if teacher role)
    if (req.user.role === 'TEACHER') {
      if (!req.user.teacher) {
        return res.status(403).json({
          success: false,
          error: 'Teacher profile not found'
        });
      }

      // Check if teacher is assigned to student's class
      const student = await prisma.student.findUnique({
        where: { id: parseInt(studentId) }
      });

      const isAssigned = await prisma.classTeacher.findFirst({
        where: {
          teacherId: req.user.teacher.id,
          classId: student.classId
        }
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'You are not assigned to this student\'s class'
        });
      }
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Create or update attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: parseInt(studentId),
          date: attendanceDate
        }
      },
      create: {
        studentId: parseInt(studentId),
        date: attendanceDate,
        status,
        markedBy: req.user.teacher?.id || req.user.id,
        remarks
      },
      update: {
        status,
        markedBy: req.user.teacher?.id || req.user.id,
        remarks
      },
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Bulk mark attendance for multiple students
const bulkMarkAttendance = async (req, res) => {
  try {
    const { records, attendanceRecords, date, classId } = req.body;

    // Support both 'records' and 'attendanceRecords' for backwards compatibility
    const recordsToProcess = records || attendanceRecords;

    if (!recordsToProcess || !Array.isArray(recordsToProcess) || !date) {
      return res.status(400).json({
        success: false,
        error: 'Attendance records array and date are required'
      });
    }

    // Ensure user has teacher profile
    if (!req.user.teacher) {
      return res.status(403).json({
        success: false,
        error: 'Only teachers can mark attendance. Please ensure you have a teacher account.'
      });
    }

    const teacherId = req.user.teacher.id;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Verify teacher is assigned to this class
    if (classId) {
      const isAssigned = await prisma.classTeacher.findFirst({
        where: {
          teacherId: teacherId,
          classId: parseInt(classId)
        }
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          error: 'You are not assigned to this class'
        });
      }
    } else {
      // If no classId provided, verify teacher is assigned to all students' classes
      const studentIds = recordsToProcess.map(r => parseInt(r.studentId));
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { classId: true }
      });

      const classIds = [...new Set(students.map(s => s.classId))];

      for (const cId of classIds) {
        const isAssigned = await prisma.classTeacher.findFirst({
          where: {
            teacherId: teacherId,
            classId: cId
          }
        });

        if (!isAssigned) {
          return res.status(403).json({
            success: false,
            error: 'You are not assigned to all students\' classes'
          });
        }
      }
    }

    // Process bulk attendance
    const results = [];
    for (const record of recordsToProcess) {
      // Skip invalid records
      if (!record.studentId || !record.status) {
        continue;
      }

      const attendance = await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: parseInt(record.studentId),
            date: attendanceDate
          }
        },
        create: {
          studentId: parseInt(record.studentId),
          date: attendanceDate,
          status: record.status,
          markedBy: teacherId,
          remarks: record.remarks
        },
        update: {
          status: record.status,
          markedBy: teacherId,
          remarks: record.remarks
        }
      });

      results.push(attendance);
    }

    res.json({
      success: true,
      data: results,
      message: `Attendance marked for ${results.length} students`
    });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark attendance'
    });
  }
};

// Get student attendance summary
const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const where = {
      studentId: parseInt(studentId)
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    // Calculate statistics
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const absent = attendanceRecords.filter(a => a.status === 'ABSENT').length;
    const late = attendanceRecords.filter(a => a.status === 'LATE').length;
    const excused = attendanceRecords.filter(a => a.status === 'EXCUSED').length;
    const sick = attendanceRecords.filter(a => a.status === 'SICK').length;

    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          total,
          present,
          absent,
          late,
          excused,
          sick,
          percentage: parseFloat(percentage)
        },
        records: attendanceRecords
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get class attendance report
const getClassAttendanceReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to all time if dates not provided
    const whereClause = {
      classId: parseInt(classId),
      isActive: true
    };

    const attendanceWhere = {};
    if (startDate && endDate) {
      attendanceWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        attendances: {
          where: attendanceWhere
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    const report = students.map(student => {
      const total = student.attendances.length;
      const present = student.attendances.filter(a => a.status === 'PRESENT').length;
      const absent = student.attendances.filter(a => a.status === 'ABSENT').length;
      const percentage = total > 0 ? (present / total * 100).toFixed(2) : 0;

      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        total,
        present,
        absent,
        percentage: parseFloat(percentage)
      };
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllAttendance,
  getClassAttendance,
  markAttendance,
  bulkMarkAttendance,
  getStudentAttendanceSummary,
  getClassAttendanceReport,
  deleteAttendance
};
