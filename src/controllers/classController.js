const prisma = require('../utils/prisma');

// Get all classes
const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        feeStructure: true,
        students: {
          where: { isActive: true }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single class by ID
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        feeStructure: true,
        students: {
          where: { isActive: true }
        }
      }
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if class already exists
    const existingClass = await prisma.class.findUnique({
      where: { name }
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        error: 'Class with this name already exists'
      });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      data: newClass,
      message: 'Class created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const updatedClass = await prisma.class.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        isActive
      }
    });

    res.json({
      success: true,
      data: updatedClass,
      message: 'Class updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if class has students
    const classWithStudents = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (classWithStudents._count.students > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete class with enrolled students. Please reassign or remove students first.'
      });
    }

    await prisma.class.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
