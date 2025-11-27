const prisma = require('../utils/prisma');

// Get all fee records with filters
const getAllFeeRecords = async (req, res) => {
  try {
    const { studentId, month, year, status } = req.query;

    const where = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (month) where.month = month;
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    const feeRecords = await prisma.feeRecord.findMany({
      where,
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: feeRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get fee record by ID
const getFeeRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: {
          include: {
            class: true
          }
        }
      }
    });

    if (!feeRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fee record not found'
      });
    }

    res.json({
      success: true,
      data: feeRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Record payment (update fee record)
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMode, remarks } = req.body;

    // Get current fee record
    const currentRecord = await prisma.feeRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fee record not found'
      });
    }

    // Calculate new amounts
    const newAmountPaid = currentRecord.amountPaid + parseFloat(amountPaid);
    const newBalance = currentRecord.totalFee - newAmountPaid;

    // Determine status
    let status;
    if (newBalance <= 0) {
      status = 'Paid';
    } else if (new Date() > currentRecord.dueDate) {
      status = 'Overdue';
    } else {
      status = 'Pending';
    }

    // Update fee record
    const updatedRecord = await prisma.feeRecord.update({
      where: { id: parseInt(id) },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status,
        paymentDate: new Date(),
        paymentMode,
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
      data: updatedRecord,
      message: `Payment of ₹${amountPaid} recorded successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update fee record status (for manual adjustments)
const updateFeeRecordStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRecord = await prisma.feeRecord.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        student: true
      }
    });

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Fee record status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Auto-update overdue status
const updateOverdueStatus = async (req, res) => {
  try {
    const today = new Date();

    // Find all pending records with past due dates
    const overdueRecords = await prisma.feeRecord.updateMany({
      where: {
        status: 'Pending',
        dueDate: {
          lt: today
        },
        balance: {
          gt: 0
        }
      },
      data: {
        status: 'Overdue'
      }
    });

    res.json({
      success: true,
      message: `Updated ${overdueRecords.count} records to overdue status`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get overdue fee records
const getOverdueFeeRecords = async (req, res) => {
  try {
    const overdueRecords = await prisma.feeRecord.findMany({
      where: {
        status: 'Overdue'
      },
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json({
      success: true,
      data: overdueRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get pending fee records
const getPendingFeeRecords = async (req, res) => {
  try {
    const pendingRecords = await prisma.feeRecord.findMany({
      where: {
        status: 'Pending'
      },
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json({
      success: true,
      data: pendingRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Generate monthly fee records for students
const generateMonthlyFeeRecords = async (req, res) => {
  try {
    const { month, year, classId, studentIds, dueDate, examFee, otherFee } = req.body;

    // Validate required fields
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required'
      });
    }

    // Parse one-time fees
    const oneTimeExamFee = parseFloat(examFee) || 0;
    const oneTimeOtherFee = parseFloat(otherFee) || 0;

    // Determine which students to generate fees for
    let studentsToProcess;
    if (studentIds && studentIds.length > 0) {
      // Generate for specific students
      studentsToProcess = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          isActive: true
        },
        include: { class: true }
      });
    } else if (classId) {
      // Generate for all students in a class
      studentsToProcess = await prisma.student.findMany({
        where: {
          classId: parseInt(classId),
          isActive: true
        },
        include: { class: true }
      });
    } else {
      // Generate for all active students
      studentsToProcess = await prisma.student.findMany({
        where: { isActive: true },
        include: { class: true }
      });
    }

    if (studentsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active students found to generate fee records'
      });
    }

    // Calculate due date (default to 10th of the month)
    const dueDateObj = dueDate
      ? new Date(dueDate)
      : new Date(parseInt(year), getMonthNumber(month), 10);

    const createdRecords = [];
    const skippedRecords = [];

    for (const student of studentsToProcess) {
      // Check if record already exists
      const existingRecord = await prisma.feeRecord.findUnique({
        where: {
          studentId_month_year: {
            studentId: student.id,
            month: month,
            year: parseInt(year)
          }
        }
      });

      if (existingRecord) {
        skippedRecords.push({
          studentId: student.id,
          studentName: student.name,
          reason: 'Record already exists'
        });
        continue;
      }

      // Create fee record with recurring fees + one-time fees
      const recurringTotal = student.tuitionFee + student.labFee +
                            student.libraryFee + student.sportsFee;
      const totalFee = recurringTotal + oneTimeExamFee + oneTimeOtherFee;

      const feeRecord = await prisma.feeRecord.create({
        data: {
          studentId: student.id,
          month: month,
          year: parseInt(year),
          tuitionFee: student.tuitionFee,
          labFee: student.labFee,
          libraryFee: student.libraryFee,
          sportsFee: student.sportsFee,
          examFee: oneTimeExamFee,
          otherFee: oneTimeOtherFee,
          totalFee: totalFee,
          balance: totalFee,
          dueDate: dueDateObj,
          status: 'Pending'
        },
        include: {
          student: {
            include: { class: true }
          }
        }
      });

      createdRecords.push(feeRecord);
    }

    res.status(201).json({
      success: true,
      data: {
        created: createdRecords,
        skipped: skippedRecords
      },
      message: `Generated ${createdRecords.length} fee record(s) for ${month} ${year}. Skipped ${skippedRecords.length} existing record(s).`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add one-time fees to an existing fee record
const addOneTimeFees = async (req, res) => {
  try {
    const { id } = req.params;
    const { examFee, otherFee, remarks } = req.body;

    // Get current fee record
    const currentRecord = await prisma.feeRecord.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentRecord) {
      return res.status(404).json({
        success: false,
        error: 'Fee record not found'
      });
    }

    // Calculate new fees
    const newExamFee = currentRecord.examFee + (parseFloat(examFee) || 0);
    const newOtherFee = currentRecord.otherFee + (parseFloat(otherFee) || 0);

    // Recalculate total fee and balance
    const newTotalFee = currentRecord.tuitionFee + currentRecord.labFee +
                       currentRecord.libraryFee + currentRecord.sportsFee +
                       newExamFee + newOtherFee;
    const newBalance = newTotalFee - currentRecord.amountPaid;

    // Determine status
    let status = currentRecord.status;
    if (newBalance <= 0) {
      status = 'Paid';
    } else if (new Date() > currentRecord.dueDate) {
      status = 'Overdue';
    } else {
      status = 'Pending';
    }

    // Update fee record
    const updatedRecord = await prisma.feeRecord.update({
      where: { id: parseInt(id) },
      data: {
        examFee: newExamFee,
        otherFee: newOtherFee,
        totalFee: newTotalFee,
        balance: newBalance,
        status,
        remarks: remarks || currentRecord.remarks
      },
      include: {
        student: {
          include: { class: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedRecord,
      message: `One-time fees added successfully. New total: Rs. ${newTotalFee}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to convert month name to number
function getMonthNumber(monthName) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return months[monthName] || 0;
}

module.exports = {
  getAllFeeRecords,
  getFeeRecordById,
  recordPayment,
  updateFeeRecordStatus,
  updateOverdueStatus,
  getOverdueFeeRecords,
  getPendingFeeRecords,
  generateMonthlyFeeRecords,
  addOneTimeFees
};
