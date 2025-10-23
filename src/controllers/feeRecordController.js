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

module.exports = {
  getAllFeeRecords,
  getFeeRecordById,
  recordPayment,
  updateFeeRecordStatus,
  updateOverdueStatus,
  getOverdueFeeRecords,
  getPendingFeeRecords
};
