const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const migrateAttendanceStatus = async () => {
  try {
    console.log('🔄 Starting attendance status migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all attendances with old status values
    const oldAttendances = await Attendance.find({
      status: { $in: ['hadir', 'tidak_hadir'] }
    });

    console.log(`📊 Found ${oldAttendances.length} records with old status values`);

    if (oldAttendances.length === 0) {
      console.log('✅ No records to migrate');
      await mongoose.disconnect();
      return;
    }

    // Migrate each record
    for (const attendance of oldAttendances) {
      const oldStatus = attendance.status;
      
      // Map old status to new status
      // 'hadir' → 'masuk' (assume check-in)
      // 'tidak_hadir' → 'izin' (assume excuse)
      let newStatus = 'masuk';
      if (oldStatus === 'tidak_hadir') {
        newStatus = 'izin';
      }

      attendance.status = newStatus;
      await attendance.save();
      
      console.log(`✓ Record ${attendance._id}: ${oldStatus} → ${newStatus}`);
    }

    console.log('✅ Migration completed successfully!');
    console.log(`Total migrated: ${oldAttendances.length}`);

    // Verify migration
    const remainingOld = await Attendance.countDocuments({
      status: { $in: ['hadir', 'tidak_hadir'] }
    });

    if (remainingOld === 0) {
      console.log('✅ Verification passed: No old status values remaining');
    } else {
      console.log(`⚠️ Warning: ${remainingOld} records still have old status`);
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateAttendanceStatus();
