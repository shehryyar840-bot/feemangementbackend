const prisma = require('./prisma');
const { hashPassword } = require('./password');

/**
 * Create default admin user
 * Email: admin@school.com
 * Password: admin123
 */
async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@school.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');

    const admin = await prisma.user.create({
      data: {
        email: 'admin@school.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'ADMIN',
        isActive: true
      }
    });

    console.log('✅ Default admin user created successfully');
    console.log('📧 Email: admin@school.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('\n✨ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedAdmin;
