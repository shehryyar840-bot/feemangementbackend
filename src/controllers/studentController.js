const prisma = require('../utils/prisma');

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const { classId, isActive } = req.query;

    const where = {};
    if (classId) where.classId = parseInt(classId);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const students = await prisma.student.findMany({
      where,
      include: {
        class: {
          include: {
            feeStructure: true
          }
        }
      },
      orderBy: { name: 'asc' }
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

// Get single student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          include: {
            feeStructure: true
          }
        },
        feeRecords: {
          orderBy: [
            { year: 'desc' },
            { month: 'asc' }
          ]
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new student with auto-generated fee records
const createStudent = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      dateOfBirth,
      classId,
      rollNumber,
      phoneNumber,
      address,
      admissionDate,
      tuitionFee,
      labFee,
      libraryFee,
      sportsFee
    } = req.body;

    // Check if roll number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber }
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'Student with this roll number already exists'
      });
    }

    // Calculate total monthly fee from RECURRING fees only (NOT including one-time fees)
    // Recurring fees: tuition, lab, library, sports (charged every month)
    // One-time fees: exam, other/books/paper fund (added manually when needed)
    const studentTuitionFee = parseFloat(tuitionFee) || 0;
    const studentLabFee = parseFloat(labFee) || 0;
    const studentLibraryFee = parseFloat(libraryFee) || 0;
    const studentSportsFee = parseFloat(sportsFee) || 0;

    const totalMonthlyFee = studentTuitionFee + studentLabFee + studentLibraryFee + studentSportsFee;

    // Create student WITHOUT auto-generating fee records
    // Admin will manually generate fee records for each month
    const student = await prisma.student.create({
      data: {
        name,
        fatherName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        classId: parseInt(classId),
        rollNumber,
        phoneNumber,
        address,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        tuitionFee: studentTuitionFee,
        labFee: studentLabFee,
        libraryFee: studentLibraryFee,
        sportsFee: studentSportsFee,
        examFee: 0, // One-time fees not stored in student model
        otherFee: 0, // One-time fees not stored in student model
        totalMonthlyFee: totalMonthlyFee
      },
      include: {
        class: true
      }
    });

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully. Generate monthly fee records from the Fee Records page.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      fatherName,
      dateOfBirth,
      classId,
      phoneNumber,
      address,
      isActive,
      tuitionFee,
      labFee,
      libraryFee,
      sportsFee,
      examFee,
      otherFee
    } = req.body;

    // Check if fees are being updated
    const feesUpdated = tuitionFee !== undefined || labFee !== undefined ||
                        libraryFee !== undefined || sportsFee !== undefined ||
                        examFee !== undefined || otherFee !== undefined;

    let totalMonthlyFee = undefined;
    let newTuitionFee, newLabFee, newLibraryFee, newSportsFee, newExamFee, newOtherFee;

    if (feesUpdated) {
      const currentStudent = await prisma.student.findUnique({
        where: { id: parseInt(id) }
      });

      newTuitionFee = tuitionFee !== undefined ? parseFloat(tuitionFee) : currentStudent.tuitionFee;
      newLabFee = labFee !== undefined ? parseFloat(labFee) : currentStudent.labFee;
      newLibraryFee = libraryFee !== undefined ? parseFloat(libraryFee) : currentStudent.libraryFee;
      newSportsFee = sportsFee !== undefined ? parseFloat(sportsFee) : currentStudent.sportsFee;
      newExamFee = examFee !== undefined ? parseFloat(examFee) : currentStudent.examFee;
      newOtherFee = otherFee !== undefined ? parseFloat(otherFee) : currentStudent.otherFee;

      totalMonthlyFee = newTuitionFee + newLabFee + newLibraryFee + newSportsFee + newExamFee + newOtherFee;

      // Update all pending and unpaid fee records with new fee amounts
      await prisma.feeRecord.updateMany({
        where: {
          studentId: parseInt(id),
          status: { in: ['Pending', 'Overdue'] } // Only update unpaid records
        },
        data: {
          tuitionFee: newTuitionFee,
          labFee: newLabFee,
          libraryFee: newLibraryFee,
          sportsFee: newSportsFee,
          examFee: newExamFee,
          otherFee: newOtherFee,
          totalFee: totalMonthlyFee,
          balance: totalMonthlyFee // Reset balance for unpaid records
        }
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(id) },
      data: {
        name,
        fatherName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        phoneNumber,
        address,
        isActive,
        tuitionFee: tuitionFee !== undefined ? parseFloat(tuitionFee) : undefined,
        labFee: labFee !== undefined ? parseFloat(labFee) : undefined,
        libraryFee: libraryFee !== undefined ? parseFloat(libraryFee) : undefined,
        sportsFee: sportsFee !== undefined ? parseFloat(sportsFee) : undefined,
        examFee: examFee !== undefined ? parseFloat(examFee) : undefined,
        otherFee: otherFee !== undefined ? parseFloat(otherFee) : undefined,
        totalMonthlyFee
      },
      include: {
        class: true
      }
    });

    res.json({
      success: true,
      data: updatedStudent,
      message: feesUpdated
        ? 'Student and fee records updated successfully'
        : 'Student updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete student (permanently removes from database)
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Permanently delete student
const permanentDeleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Student permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  permanentDeleteStudent
};
