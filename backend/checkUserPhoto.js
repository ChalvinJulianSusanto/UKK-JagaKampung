const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const User = require('./models/User');

async function checkUserPhoto() {
    try {
        // Find user M Rafi
        const user = await User.findOne({ name: /Rafi/i });

        if (!user) {
            console.log('User Rafi not found');
            return;
        }

        console.log('\n=== User M Rafi Afrizal Info ===');
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Photo:', user.photo);
        console.log('Google ID:', user.googleId);
        console.log('Auth Provider:', user.authProvider);
        console.log('Created At:', user.createdAt);
        console.log('================================\n');

        if (user.photo) {
            console.log('✅ User has photo URL');
        } else {
            console.log('❌ No photo URL in database - Google may not have provided one or login failed to save it');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

checkUserPhoto();
