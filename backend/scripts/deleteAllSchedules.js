/**
 * Script untuk menghapus semua schedule (untuk testing)
 * Jalankan: node scripts/deleteAllSchedules.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const deleteAllSchedules = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const count = await Schedule.countDocuments();
    console.log(`\n⚠️  Found ${count} schedule(s) in database.`);

    if (count === 0) {
      console.log('No schedules to delete.');
      process.exit(0);
    }

    rl.question('Are you sure you want to DELETE ALL schedules? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        await Schedule.deleteMany({});
        console.log('✅ All schedules deleted successfully!');
      } else {
        console.log('❌ Deletion cancelled.');
      }
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
};

deleteAllSchedules();
