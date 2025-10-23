const prisma = require('../utils/prisma');

// Get dashboard summary statistics
const getDashboardStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Execute all queries in parallel using Promise.all
    const [
      totalStudents,
      totalCollectedData,
      totalPendingData,
      totalOverdueData,
      paidCount,
      pendingCount,
      overdueCount,
      recentOverdue
    ] = await Promise.all([
      // Total students
      prisma.student.count({
        where: { isActive: true }
      }),

      // Total collected (sum of amountPaid for current year)
      prisma.feeRecord.aggregate({
        where: { year: currentYear },
        _sum: {
          amountPaid: true
        }
      }),

      // Total pending (sum of balance for Pending status)
      prisma.feeRecord.aggregate({
        where: {
          year: currentYear,
          status: 'Pending'
        },
        _sum: {
          balance: true
        }
      }),

      // Total overdue (sum of balance for Overdue status)
      prisma.feeRecord.aggregate({
        where: {
          year: currentYear,
          status: 'Overdue'
        },
        _sum: {
          balance: true
        }
      }),

      // Payment status breakdown - Paid
      prisma.feeRecord.count({
        where: { year: currentYear, status: 'Paid' }
      }),

      // Payment status breakdown - Pending
      prisma.feeRecord.count({
        where: { year: currentYear, status: 'Pending' }
      }),

      // Payment status breakdown - Overdue
      prisma.feeRecord.count({
        where: { year: currentYear, status: 'Overdue' }
      }),

      // Recent overdue students (last 10)
      prisma.feeRecord.findMany({
        where: {
          status: 'Overdue',
          year: currentYear
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
        },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalCollected: totalCollectedData._sum.amountPaid || 0,
          totalPending: totalPendingData._sum.balance || 0,
          totalOverdue: totalOverdueData._sum.balance || 0
        },
        statusBreakdown: {
          paid: paidCount,
          pending: pendingCount,
          overdue: overdueCount
        },
        recentOverdue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get monthly collection trend
const getMonthlyTrend = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const collected = await prisma.feeRecord.aggregate({
          where: {
            month,
            year: currentYear
          },
          _sum: {
            amountPaid: true
          }
        });

        const expected = await prisma.feeRecord.aggregate({
          where: {
            month,
            year: currentYear
          },
          _sum: {
            totalFee: true
          }
        });

        return {
          month,
          collected: collected._sum.amountPaid || 0,
          expected: expected._sum.totalFee || 0,
          pending: (expected._sum.totalFee || 0) - (collected._sum.amountPaid || 0)
        };
      })
    );

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get class-wise collection statistics
const getClassWiseStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        students: {
          where: { isActive: true },
          include: {
            feeRecords: {
              where: { year: currentYear }
            }
          }
        },
        feeStructure: true
      }
    });

    const classStats = classes.map(cls => {
      const totalStudents = cls.students.length;

      let totalCollected = 0;
      let totalExpected = 0;

      cls.students.forEach(student => {
        student.feeRecords.forEach(record => {
          totalCollected += record.amountPaid;
          totalExpected += record.totalFee;
        });
      });

      return {
        className: cls.name,
        totalStudents,
        totalCollected,
        totalExpected,
        totalPending: totalExpected - totalCollected,
        monthlyFee: cls.feeStructure?.totalMonthlyFee || 0
      };
    });

    res.json({
      success: true,
      data: classStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get payment mode breakdown
const getPaymentModeStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const paymentModes = await prisma.feeRecord.groupBy({
      by: ['paymentMode'],
      where: {
        year: currentYear,
        paymentMode: {
          not: null
        }
      },
      _sum: {
        amountPaid: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      success: true,
      data: paymentModes.map(pm => ({
        mode: pm.paymentMode || 'Unknown',
        totalAmount: pm._sum.amountPaid || 0,
        transactionCount: pm._count.id
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyTrend,
  getClassWiseStats,
  getPaymentModeStats
};
