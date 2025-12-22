const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const testApprove = async () => {
  try {
    console.log('🧪 Testing approval on existing record...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get first attendance record
    const record = await Attendance.findOne();
    
    if (!record) {
      console.log('⚠️ No records found');
      await mongoose.disconnect();
      return;
    }

    console.log('📝 Testing record:', record._id);
    console.log('   Status:', record.status);
    console.log('   Current approved:', record.approved);

    // Try to update
    record.approved = true;
    record.approvedBy = new mongoose.Types.ObjectId();
    record.approvedAt = new Date();
    
    await record.save();
    console.log('✅ Approval save successful!');

    const updated = await Attendance.findById(record._id);
    console.log('✅ Verified - Record now has approved:', updated.approved);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testApprove();
