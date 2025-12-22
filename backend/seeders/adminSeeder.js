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

// Seed admin user
const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@jagakampung.com' });

    if (adminExists) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email: admin@jagakampung.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin JagaKampung',
      email: 'admin@jagakampung.com',
      password: 'admin123',
      phone: '081234567890',
      rt: '01',
      role: 'admin',
      status: 'active',
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email: admin@jagakampung.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('⚠️  PENTING: Segera ubah password setelah login pertama!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Run seeder
seedAdmin();
