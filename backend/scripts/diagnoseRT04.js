/**
 * Diagnostic script untuk memeriksa data RT 04 dan debug schedule issues
 */
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Schedule = require('../models/Schedule');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const diagnose = async () => {
  try {
    console.log('\n=== JAGAKAMPUNG SCHEDULE DIAGNOSTICS ===\n');

    // 1. Check all RTs in database
    console.log('1. USERS BY RT:');
    const rtCounts = await User.aggregate([
      { $group: { _id: '$rt', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.table(rtCounts);

    // 2. Check RT 04 specifically
    console.log('\n2. RT 04 USERS:');
    const rt04Users = await User.find({ rt: '04' }).select('name email rt role status');
    console.log(`Found ${rt04Users.length} users in RT 04`);
    if (rt04Users.length === 0) {
      console.warn('⚠ WARNING: No users found in RT 04!');
    }
    console.table(rt04Users);

    // 3. Check RT 04 schedules
    console.log('\n3. RT 04 SCHEDULES:');
    const rt04Schedules = await Schedule.find({ rt: '04' })
      .populate('createdBy', 'name email');
    console.log(`Found ${rt04Schedules.length} schedules for RT 04`);
    rt04Schedules.forEach(sched => {
      console.log(`  - ${sched.month}/${sched.year}: ${sched.entries.length} entries`);
    });

    // 4. Check data types
    console.log('\n4. DATA TYPE CHECK:');
    const firstUser = await User.findOne({ rt: '04' });
    const firstSchedule = await Schedule.findOne({ rt: '04' });
    if (firstUser) {
      console.log(`User RT type: ${typeof firstUser.rt} | Value: "${firstUser.rt}"`);
    }
    if (firstSchedule) {
      console.log(`Schedule RT type: ${typeof firstSchedule.rt} | Value: "${firstSchedule.rt}"`);
    }

    // 5. Verify enum values
    console.log('\n5. MODEL VALIDATION:');
    console.log('User enum RT:', User.schema.paths.rt.enumValues);
    console.log('Schedule enum RT:', Schedule.schema.paths.rt.enumValues);

    console.log('\n=== DIAGNOSTICS COMPLETE ===\n');
  } catch (error) {
    console.error('Error during diagnostics:', error.message);
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

// Run diagnostics
connectDB().then(diagnose);
