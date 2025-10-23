const prisma = require('../utils/prisma');
const { hashPassword, comparePassword, validatePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teacher: {
          include: {
            classTeachers: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Register new user (Admin only)
const register = async (req, res) => {
  try {
    const { email, password, name, role, teacherData } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.message
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with teacher profile if role is TEACHER
    let user;
    if (role === 'TEACHER' && teacherData) {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'TEACHER',
          teacher: {
            create: {
              employeeId: teacherData.employeeId,
              phoneNumber: teacherData.phoneNumber,
              address: teacherData.address,
              qualification: teacherData.qualification,
              joiningDate: teacherData.joiningDate ? new Date(teacherData.joiningDate) : new Date()
            }
          }
        },
        include: {
          teacher: true
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'TEACHER'
        }
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        teacher: {
          include: {
            classTeachers: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.message
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  // In JWT authentication, logout is typically handled client-side by removing the token
  // This endpoint is for consistency and can be used for logging/analytics
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  login,
  register,
  getProfile,
  changePassword,
  logout
};
