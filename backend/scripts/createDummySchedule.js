/**
 * Script untuk membuat dummy schedule untuk testing
 * Jalankan: node scripts/createDummySchedule.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const User = require('../models/User');

const createDummySchedule = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user untuk uploadedBy
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ Admin user not found. Please create admin user first.');
      process.exit(1);
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // RT yang akan dibuat schedulenya
    const rtList = ['01', '02', '03', '04', '05', '06'];

    console.log(`\nCreating schedules for ${currentMonth}/${currentYear}...\n`);

    for (const rt of rtList) {
      // Check if schedule already exists
      const existingSchedule = await Schedule.findOne({
        rt,
        month: currentMonth,
        year: currentYear,
      });

      if (existingSchedule) {
        console.log(`⚠️  Schedule for RT ${rt} already exists. Skipping...`);
        continue;
      }

      // Create dummy schedule
      const schedule = await Schedule.create({
        rt,
        month: currentMonth,
        year: currentYear,
        scheduleFile: 'https://via.placeholder.com/800x600.png?text=Dummy+Schedule+RT+' + rt,
        fileType: 'image',
        description: `Dummy schedule untuk testing RT ${rt} - ${currentMonth}/${currentYear}`,
        uploadedBy: adminUser._id,
      });

      console.log(`✅ Created schedule for RT ${rt}`);
      console.log(`   - ID: ${schedule._id}`);
      console.log(`   - Month: ${schedule.month}/${schedule.year}`);
    }

    console.log('\n🎉 All dummy schedules created successfully!');
    console.log('\nYou can now test attendance feature.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createDummySchedule();
