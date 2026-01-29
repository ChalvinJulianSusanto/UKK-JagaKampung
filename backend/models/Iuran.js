const mongoose = require('mongoose');

const iuranSchema = new mongoose.Schema(
    {
        month: {
            type: String,
            required: [true, 'Bulan harus diisi'],
            trim: true,
            // Format: YYYY-MM (e.g., "2026-01")
        },
        year: {
            type: Number,
            required: [true, 'Tahun harus diisi'],
        },
        rt: {
            type: String,
            enum: ['01', '02', '03', '04', '05', '06'],
            required: [true, 'RT harus dipilih'],
        },
        targetAmount: {
            type: Number,
            required: [true, 'Target iuran harus diisi'],
            min: 0,
        },
        collectedAmount: {
            type: Number,
            required: [true, 'Jumlah iuran terkumpul harus diisi'],
            min: 0,
            default: 0,
        },
        totalResidents: {
            type: Number,
            required: [true, 'Jumlah total warga harus diisi'],
            min: 0,
        },
        paidResidents: {
            type: Number,
            required: [true, 'Jumlah warga yang sudah bayar harus diisi'],
            min: 0,
            default: 0,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
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

// Index untuk optimasi query
iuranSchema.index({ month: 1, year: 1, rt: 1 }, { unique: true });
iuranSchema.index({ year: -1, month: -1 });
iuranSchema.index({ rt: 1 });

// Virtual untuk menghitung persentase pembayaran
iuranSchema.virtual('paymentPercentage').get(function () {
    if (this.totalResidents === 0) return 0;
    return ((this.paidResidents / this.totalResidents) * 100).toFixed(1);
});

// Virtual untuk menghitung persentase pencapaian target
iuranSchema.virtual('collectionPercentage').get(function () {
    if (this.targetAmount === 0) return 0;
    return ((this.collectedAmount / this.targetAmount) * 100).toFixed(1);
});

// Ensure virtuals are included when converting to JSON
iuranSchema.set('toJSON', { virtuals: true });
iuranSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Iuran', iuranSchema);
