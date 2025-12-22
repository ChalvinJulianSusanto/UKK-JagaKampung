const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error(`Error: ${error.message}\n`);

    // Provide helpful error messages based on error type
    if (error.message.includes('ECONNREFUSED')) {
      console.error('📍 Kemungkinan masalah:');
      console.error('   1. MongoDB belum terinstall atau tidak berjalan');
      console.error('   2. Port 27017 sudah digunakan aplikasi lain\n');
      console.error('💡 Solusi:');
      console.error('   - Gunakan MongoDB Atlas (cloud - gratis): Lihat SETUP_DATABASE.md');
      console.error('   - Atau install MongoDB local: https://www.mongodb.com/try/download/community');
      console.error('   - Windows: net start MongoDB');
      console.error('   - Linux/Mac: sudo systemctl start mongod\n');
    } else if (error.message.includes('Authentication failed')) {
      console.error('📍 Username atau password salah di connection string\n');
      console.error('💡 Solusi:');
      console.error('   - Cek username dan password di MongoDB Atlas');
      console.error('   - Pastikan special characters di-encode dengan benar\n');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
      console.error('📍 Tidak bisa terhubung ke MongoDB Atlas\n');
      console.error('💡 Solusi:');
      console.error('   1. Cek koneksi internet');
      console.error('   2. Pastikan IP 0.0.0.0/0 ada di Network Access (MongoDB Atlas)');
      console.error('   3. Cek connection string di file .env\n');
    }

    console.error('📖 Panduan lengkap: Buka file SETUP_DATABASE.md\n');
    process.exit(1);
  }
};

module.exports = connectDB;
