const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

const createTestUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'user@test.com' });

    if (existingUser) {
      console.log('ℹ️  Test user already exists:');
      console.log({
        name: existingUser.name,
        email: existingUser.email,
        rt: existingUser.rt,
        role: existingUser.role,
      });
      console.log('\n📝 You can login with:');
      console.log('   Email: user@test.com');
      console.log('   Password: password123');
      process.exit(0);
    }

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      phone: '081234567890',
      rt: '01',
      role: 'user',
      status: 'active',
    });

    console.log('✅ Test user created successfully!');
    console.log({
      name: testUser.name,
      email: testUser.email,
      phone: testUser.phone,
      rt: testUser.rt,
      role: testUser.role,
    });
    console.log('\n📝 You can now login with:');
    console.log('   Email: user@test.com');
    console.log('   Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUser();
