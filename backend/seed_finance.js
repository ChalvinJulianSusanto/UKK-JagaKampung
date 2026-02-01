// seed_finance.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
const Income = require('./models/Income');
const Budget = require('./models/Budget');
const Iuran = require('./models/Iuran');
const User = require('./models/User');

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        console.log('Seeding data...');

        // 1. Clear existing (optional - commented out to preserve data)
        // await Income.deleteMany({});
        // await Budget.deleteMany({});
        // await Iuran.deleteMany({});

        // 2. Get Admin User
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('No admin found, creating temporary admin...');
            adminUser = await User.create({
                name: 'System Admin',
                email: 'admin@system.com',
                password: 'password123',
                role: 'admin',
                rt: '01',
                authProvider: 'local'
            });
        }
        console.log('Using Admin ID:', adminUser._id);

        // 3. Add Income
        await Income.create({
            category: 'Iuran',
            amount: 7500000,
            date: new Date(),
            description: 'Iuran bulanan Februari 2026',
            rt: '01',
            year: 2026,
            month: 'Februari'
        });
        console.log('Income created');

        // 4. Add Budget
        await Budget.create({
            year: 2026,
            rt: '01',
            category: 'Keamanan',
            allocatedAmount: 2000000,
            spentAmount: 850000,
            description: 'Dana operasional pos kamling',
            createdBy: adminUser._id
        });
        await Budget.create({
            year: 2026,
            rt: '01',
            category: 'Sosial',
            allocatedAmount: 1500000,
            spentAmount: 1200000,
            description: 'Kopi dan snack jaga',
            createdBy: adminUser._id
        });
        console.log('Budget created');

        // 4. Add Iuran
        await Iuran.create({
            month: 'Februari',
            year: 2026,
            rt: '01',
            targetAmount: 5000000,
            collectedAmount: 3850000,
            totalResidents: 50,
            paidResidents: 38,
            notes: 'Sebagian belum lunas',
            createdBy: adminUser._id
        });
        console.log('Iuran created');

        console.log('Data seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
