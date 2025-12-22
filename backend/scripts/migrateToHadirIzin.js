const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const migrateAttendances = async () => {
  try {
    console.log('🔄 Migrating attendances to hadir/izin status...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all records with masuk or pulang status
    const masukPulangRecords = await Attendance.find({
      status: { $in: ['masuk', 'pulang'] }
    });

    console.log(`📊 Found ${masukPulangRecords.length} records with masuk/pulang status`);

    if (masukPulangRecords.length > 0) {
      // Update all masuk/pulang to hadir
      const updateResult = await Attendance.updateMany(
        { status: { $in: ['masuk', 'pulang'] } },
        { $set: { status: 'hadir' } }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} records from masuk/pulang → hadir`);
    }

    // Verify migration
    const verifyStats = await Attendance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\n📈 Status distribution after migration:');
    verifyStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
};

migrateAttendances();
