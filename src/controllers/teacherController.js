const prisma = require('../utils/prisma');
const { hashPassword } = require('../utils/password');

// Get all teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        classTeachers: {
          include: {
            class: true
          }
        },
        _count: {
          select: {
            attendances: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        classTeachers: {
          include: {
            class: {
              include: {
                _count: {
                  select: { students: true }
                }
              }
            }
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new teacher (creates user account + teacher profile)
const createTeacher = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      employeeId,
      phoneNumber,
      address,
      qualification,
      joiningDate
    } = req.body;

    // Validate required fields
    if (!email || !password || !name || !employeeId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, name, employee ID, and phone number are required'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Check if employee ID already exists
    const existingEmployee = await prisma.teacher.findUnique({
      where: { employeeId }
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with teacher profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'TEACHER',
        teacher: {
          create: {
            employeeId,
            phoneNumber,
            address,
            qualification,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date()
          }
        }
      },
      include: {
        teacher: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'Teacher created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phoneNumber,
      address,
      qualification,
      isActive
    } = req.body;

    // Get teacher with user
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Update teacher profile
    const updatedTeacher = await prisma.teacher.update({
      where: { id: parseInt(id) },
      data: {
        phoneNumber,
        address,
        qualification
      }
    });

    // Update user name and status if provided
    if (name || isActive !== undefined) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: {
          ...(name && { name }),
          ...(isActive !== undefined && { isActive })
        }
      });
    }

    // Fetch updated teacher with user
    const result = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        },
        classTeachers: {
          include: {
            class: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: result,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete teacher (soft delete - deactivate user account)
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Soft delete - deactivate user account
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Teacher deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Assign teacher to class
const assignToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId, subject, isPrimary } = req.body;

    if (!classId) {
      return res.status(400).json({
        success: false,
        error: 'Class ID is required'
      });
    }

    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    });

    if (!classExists) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check if already assigned
    const existingAssignment = await prisma.classTeacher.findUnique({
      where: {
        teacherId_classId: {
          teacherId: parseInt(id),
          classId: parseInt(classId)
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Teacher is already assigned to this class'
      });
    }

    // Create assignment
    const assignment = await prisma.classTeacher.create({
      data: {
        teacherId: parseInt(id),
        classId: parseInt(classId),
        subject,
        isPrimary: isPrimary || false
      },
      include: {
        class: true,
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
      }
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: 'Teacher assigned to class successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Remove teacher from class
const removeFromClass = async (req, res) => {
  try {
    const { id, classId } = req.params;

    const assignment = await prisma.classTeacher.findUnique({
      where: {
        teacherId_classId: {
          teacherId: parseInt(id),
          classId: parseInt(classId)
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Teacher is not assigned to this class'
      });
    }

    await prisma.classTeacher.delete({
      where: {
        teacherId_classId: {
          teacherId: parseInt(id),
          classId: parseInt(classId)
        }
      }
    });

    res.json({
      success: true,
      message: 'Teacher removed from class successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get teacher's assigned classes
const getAssignedClasses = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: {
        classTeachers: {
          include: {
            class: {
              include: {
                _count: {
                  select: { students: true }
                }
              }
            }
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teacher.classTeachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current teacher's assigned classes (for logged-in teacher)
const getMyClasses = async (req, res) => {
  try {
    if (!req.user.teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher profile not found'
      });
    }

    const classes = await prisma.classTeacher.findMany({
      where: {
        teacherId: req.user.teacher.id
      },
      include: {
        class: {
          include: {
            students: {
              where: { isActive: true }
            },
            _count: {
              select: { students: true }
            }
          }
        }
      }
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

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignToClass,
  removeFromClass,
  getAssignedClasses,
  getMyClasses
};
