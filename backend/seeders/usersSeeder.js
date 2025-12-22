const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Sample users data
const users = [
  {
    name: 'Budi Santoso',
    email: 'budi@test.com',
    password: 'password123',
    phone: '081234567891',
    rt: '01',
    role: 'user',
    status: 'active',
  },
  {
    name: 'Siti Rahayu',
    email: 'siti@test.com',
    password: 'password123',
    phone: '081234567892',
    rt: '01',
    role: 'user',
    status: 'active',
  },
  {
    name: 'Ahmad Fadli',
    email: 'ahmad@test.com',
    password: 'password123',
    phone: '081234567893',
    rt: '02',
    role: 'user',
    status: 'active',
  },
  {
    name: 'Dewi Lestari',
    email: 'dewi@test.com',
    password: 'password123',
    phone: '081234567894',
    rt: '02',
    role: 'user',
    status: 'active',
  },
  {
    name: 'Rudi Hartono',
    email: 'rudi@test.com',
    password: 'password123',
    phone: '081234567895',
    rt: '03',
    role: 'user',
    status: 'active',
  },
  {
    name: 'Linda Wijaya',
    email: 'linda@test.com',
    password: 'password123',
    phone: '081234567896',
    rt: '03',
    role: 'user',
    status: 'active',
  },
];

// Seed users
const seedUsers = async () => {
  try {
    await connectDB();

    console.log('🌱 Seeding users...\n');

    let createdCount = 0;
    let existingCount = 0;

    for (const userData of users) {
      // Check if user already exists
      const userExists = await User.findOne({ email: userData.email });

      if (userExists) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        existingCount++;
        continue;
      }

      // Create user
      await User.create(userData);
      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      createdCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} users`);
    console.log(`   ⚠️  Skipped (already exists): ${existingCount} users`);
    console.log('');
    console.log('🔑 Login credentials for all test users:');
    console.log('   Email: [user-email]@test.com');
    console.log('   Password: password123');
    console.log('');
    console.log('📧 Test user emails:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.name} (RT ${user.rt})`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run seeder
seedUsers();
