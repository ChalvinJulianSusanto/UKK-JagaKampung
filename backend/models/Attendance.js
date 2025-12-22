const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    rt: {
      type: String,
      required: [true, 'RT harus diisi'],
      enum: ['01', '02', '03', '04', '05', '06'],
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['hadir', 'izin'],
      required: true,
    },
    type: {
      type: String,
      enum: ['masuk', 'pulang', 'izin'],
      required: true,
    },
    photo: {
      type: String,
      default: null,
    },
    photoPublicId: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    approved: {
      type: Boolean,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk query yang sering digunakan
attendanceSchema.index({ user: 1, date: -1 });
attendanceSchema.index({ rt: 1, date: -1 });
attendanceSchema.index({ schedule: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
