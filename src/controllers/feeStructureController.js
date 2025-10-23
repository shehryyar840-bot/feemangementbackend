const prisma = require('../utils/prisma');

// Get all fee structures
const getAllFeeStructures = async (req, res) => {
  try {
    const feeStructures = await prisma.feeStructure.findMany({
      include: {
        class: true
      },
      orderBy: {
        class: {
          name: 'asc'
        }
      }
    });

    res.json({
      success: true,
      data: feeStructures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get fee structure by class ID
const getFeeStructureByClassId = async (req, res) => {
  try {
    const { classId } = req.params;
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { classId: parseInt(classId) },
      include: {
        class: true
      }
    });

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        error: 'Fee structure not found for this class'
      });
    }

    res.json({
      success: true,
      data: feeStructure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create fee structure
const createFeeStructure = async (req, res) => {
  try {
    const {
      classId,
      tuitionFee,
      labFee = 0,
      libraryFee = 0,
      sportsFee = 0,
      examFee = 0,
      otherFee = 0
    } = req.body;

    // Calculate total monthly fee
    const totalMonthlyFee = tuitionFee + labFee + libraryFee + sportsFee + examFee + otherFee;

    // Check if fee structure already exists for this class
    const existingFeeStructure = await prisma.feeStructure.findUnique({
      where: { classId: parseInt(classId) }
    });

    if (existingFeeStructure) {
      return res.status(400).json({
        success: false,
        error: 'Fee structure already exists for this class. Use update to modify it.'
      });
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        classId: parseInt(classId),
        tuitionFee,
        labFee,
        libraryFee,
        sportsFee,
        examFee,
        otherFee,
        totalMonthlyFee
      },
      include: {
        class: true
      }
    });

    res.status(201).json({
      success: true,
      data: feeStructure,
      message: 'Fee structure created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update fee structure
const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tuitionFee,
      labFee,
      libraryFee,
      sportsFee,
      examFee,
      otherFee
    } = req.body;

    // Get current fee structure
    const currentFeeStructure = await prisma.feeStructure.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentFeeStructure) {
      return res.status(404).json({
        success: false,
        error: 'Fee structure not found'
      });
    }

    // Calculate new total
    const updatedData = {
      tuitionFee: tuitionFee ?? currentFeeStructure.tuitionFee,
      labFee: labFee ?? currentFeeStructure.labFee,
      libraryFee: libraryFee ?? currentFeeStructure.libraryFee,
      sportsFee: sportsFee ?? currentFeeStructure.sportsFee,
      examFee: examFee ?? currentFeeStructure.examFee,
      otherFee: otherFee ?? currentFeeStructure.otherFee
    };

    updatedData.totalMonthlyFee =
      updatedData.tuitionFee +
      updatedData.labFee +
      updatedData.libraryFee +
      updatedData.sportsFee +
      updatedData.examFee +
      updatedData.otherFee;

    const feeStructure = await prisma.feeStructure.update({
      where: { id: parseInt(id) },
      data: updatedData,
      include: {
        class: true
      }
    });

    res.json({
      success: true,
      data: feeStructure,
      message: 'Fee structure updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete fee structure
const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are students in this class
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        }
      }
    });

    if (feeStructure.class._count.students > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete fee structure. Class has enrolled students.'
      });
    }

    await prisma.feeStructure.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Fee structure deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllFeeStructures,
  getFeeStructureByClassId,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
};
