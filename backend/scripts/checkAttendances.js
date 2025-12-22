const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const checkAttendances = async () => {
  try {
    console.log('🔍 Checking attendances...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all unique status values
    const statuses = await Attendance.distinct('status');
    console.log('📊 Unique status values in DB:', statuses);

    // Get count per status
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await Attendance.countDocuments({ status })
      }))
    );
    
    console.log('📈 Count per status:');
    counts.forEach(c => console.log(`  ${c.status}: ${c.count}`));

    // Get the specific record with ID 691abbf7076b07188c2e2190
    const record = await Attendance.findById('691abbf7076b07188c2e2190');
    if (record) {
      console.log('\n🔎 Record 691abbf7076b07188c2e2190:');
      console.log('  Status:', record.status);
      console.log('  Type:', typeof record.status);
      console.log('  Full record:', JSON.stringify(record, null, 2));
    } else {
      console.log('⚠️ Record not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAttendances();
