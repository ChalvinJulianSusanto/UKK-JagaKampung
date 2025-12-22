const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const cleanOldSchedules = async () => {
  try {
    await connectDB();

    const Schedule = mongoose.model('Schedule');

    // Hapus semua schedule yang tidak memiliki field 'rt' (struktur lama)
    const result = await Schedule.deleteMany({
      rt: { $exists: false }
    });

    console.log(`✓ Berhasil menghapus ${result.deletedCount} schedule dengan struktur lama`);

    // Tampilkan total schedule yang tersisa
    const remainingSchedules = await Schedule.countDocuments();
    console.log(`✓ Total schedule yang tersisa: ${remainingSchedules}`);

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

cleanOldSchedules();
