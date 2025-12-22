const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jagakampung');
    console.log('Connected to MongoDB\n');

    const users = await User.find({}, 'name email role rt').limit(10);

    console.log('=== USERS IN DATABASE ===\n');
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   RT: ${user.rt || 'N/A'}`);
        console.log('');
      });
    }

    console.log(`Total users: ${users.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
