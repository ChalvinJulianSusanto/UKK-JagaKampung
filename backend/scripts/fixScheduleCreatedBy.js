/**
 * Fix script untuk repair schedule records yang missing createdBy
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const fixSchedules = async () => {
  try {
    console.log('\n=== FIXING SCHEDULE createdBy ===\n');

    // Find schedules without createdBy
    const schedulesWithoutCreatedBy = await Schedule.find({ createdBy: null });
    console.log(`Found ${schedulesWithoutCreatedBy.length} schedules without createdBy`);

    if (schedulesWithoutCreatedBy.length === 0) {
      console.log('✓ All schedules have createdBy. No fix needed.');
      mongoose.connection.close();
      return;
    }

    // Get any admin user to assign
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('✗ No admin user found to assign!');
      mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Using admin: ${admin.name} (${admin._id})\n`);

    // Fix each schedule
    for (const schedule of schedulesWithoutCreatedBy) {
      schedule.createdBy = admin._id;
      await schedule.save();
      console.log(`✓ Fixed RT ${schedule.rt} ${schedule.month}/${schedule.year}`);
    }

    console.log(`\n✓ Fixed ${schedulesWithoutCreatedBy.length} schedules`);
    console.log('\n=== FIX COMPLETE ===\n');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('✗ Error during fix:', error.message);
    console.error(error);
    mongoose.connection.close();
    process.exit(1);
  }
};

connectDB().then(fixSchedules);
