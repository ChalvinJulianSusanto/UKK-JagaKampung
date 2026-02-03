const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    rt: {
        type: String,
        enum: ['01', '02', '03', '04', '05', '06', 'RW-01', null],
        default: null
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Index untuk query performa
incomeSchema.index({ year: 1, month: 1 });
incomeSchema.index({ category: 1 });
incomeSchema.index({ rt: 1 });

module.exports = mongoose.model('Income', incomeSchema);
