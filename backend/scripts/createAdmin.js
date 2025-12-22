const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// User Schema (simplified)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  rt: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  photo: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@jagakampung.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email: admin@jagakampung.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await User.create({
      name: 'Admin JagaKampung',
      email: 'admin@jagakampung.com',
      password: hashedPassword,
      phone: '081234567890',
      rt: '01',
      role: 'admin',
      status: 'active',
      photo: null,
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Email: admin@jagakampung.com');
    console.log('Password: admin123');
    console.log('\n🌐 Access the app at: http://localhost:5175');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
