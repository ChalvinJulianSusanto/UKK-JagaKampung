const mongoose = require('mongoose');

// Schema untuk setiap entry jadwal ronda
const scheduleEntrySchema = new mongoose.Schema({
  guardName: {
    type: String,
    required: [true, 'Nama penjaga harus diisi'],
    trim: true,
  },
  date: {
    type: Number,
    required: [true, 'Tanggal harus diisi'],
    min: 1,
    max: 31,
  },
  day: {
    type: String,
    required: [true, 'Hari harus diisi'],
    enum: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
  },
  phone: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
}, {
  timestamps: true,
  _id: true
});

// Schema utama untuk container schedule per bulan
const scheduleSchema = new mongoose.Schema(
  {
    rt: {
      type: String,
      required: [true, 'RT harus diisi'],
      enum: ['01', '02', '03', '04', '05', '06'],
    },
    month: {
      type: Number,
      required: [true, 'Bulan harus diisi'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Tahun harus diisi'],
      min: 2024,
    },
    entries: [scheduleEntrySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk mencegah duplikasi
scheduleSchema.index({ rt: 1, month: 1, year: 1 }, { unique: true });

// Virtual untuk menghitung total entries
scheduleSchema.virtual('totalEntries').get(function () {
  return this.entries ? this.entries.length : 0;
});

// Method untuk menambah entry
scheduleSchema.methods.addEntry = function (entryData) {
  this.entries.push(entryData);
  // Save without strict validation for entries, but validate createdBy
  return this.save({ validateBeforeSave: true });
};

// Method untuk update entry
scheduleSchema.methods.updateEntry = function (entryId, entryData) {
  try {
    if (!this.entries) {
      throw new Error('Schedule tidak memiliki entries');
    }

    const entry = this.entries.id(entryId);
    if (!entry) {
      throw new Error('Entry tidak ditemukan dengan ID: ' + entryId);
    }

    // Validate and update each field if provided
    if (entryData.guardName) {
      entry.guardName = String(entryData.guardName).trim();
    }
    if (entryData.date !== undefined) {
      const dateNum = parseInt(entryData.date);
      if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
        throw new Error('Date harus angka antara 1-31');
      }
      entry.date = dateNum;
    }
    if (entryData.day) {
      const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      if (!validDays.includes(entryData.day)) {
        throw new Error(`Day harus salah satu dari: ${validDays.join(', ')}`);
      }
      entry.day = entryData.day;
    }
    if (entryData.phone !== undefined) {
      entry.phone = entryData.phone ? String(entryData.phone).trim() : '';
    }
    if (entryData.notes !== undefined) {
      entry.notes = entryData.notes ? String(entryData.notes).trim() : '';
    }
    if (entryData.email !== undefined) {
      entry.email = entryData.email ? String(entryData.email).trim().toLowerCase() : '';
    }

    return this.save();
  } catch (error) {
    console.error('Error in Schedule.updateEntry:', error.message);
    throw error;
  }
};

// Method untuk hapus entry
scheduleSchema.methods.deleteEntry = function (entryId) {
  try {
    if (!this.entries) {
      throw new Error('Schedule tidak memiliki entries');
    }

    const entry = this.entries.id(entryId);
    if (!entry) {
      throw new Error('Entry tidak ditemukan dengan ID: ' + entryId);
    }

    this.entries.pull(entryId);
    return this.save();
  } catch (error) {
    console.error('Error in Schedule.deleteEntry:', error.message);
    throw error;
  }
};

// Ensure virtuals are included
scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);