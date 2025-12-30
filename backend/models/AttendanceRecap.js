const mongoose = require('mongoose');

const attendanceRecapSchema = new mongoose.Schema({
    rt: {
        type: String,
        required: [true, 'RT harus diisi'],
        enum: ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'],
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Tanggal harus diisi'],
        index: true
    },
    time: {
        type: String,
        required: [true, 'Waktu harus diisi'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu harus HH:MM']
    },
    guards: [{
        type: String,
        required: true
    }],
    photo: {
        type: String,
        required: [true, 'Foto bukti harus di-upload']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index untuk query yang sering dipakai
attendanceRecapSchema.index({ rt: 1, date: -1 });
attendanceRecapSchema.index({ date: -1 });

// Virtual untuk mendapatkan tanggal dalam format string
attendanceRecapSchema.virtual('dateString').get(function () {
    return this.date.toISOString().split('T')[0];
});

// Method untuk check apakah recap ini untuk hari ini
attendanceRecapSchema.methods.isToday = function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recapDate = new Date(this.date);
    recapDate.setHours(0, 0, 0, 0);
    return today.getTime() === recapDate.getTime();
};

module.exports = mongoose.model('AttendanceRecap', attendanceRecapSchema);
