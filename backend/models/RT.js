const mongoose = require('mongoose');

const rtSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      enum: ['01', '02', '03', '04', '05', '06'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    kepalaRT: {
      type: String,
      trim: true,
      default: null,
    },
    totalWarga: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RT', rtSchema);
