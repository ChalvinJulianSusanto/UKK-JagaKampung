const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
    {
        year: {
            type: Number,
            required: [true, 'Tahun harus diisi'],
        },
        rt: {
            type: String,
            enum: ['01', '02', '03', '04', '05', '06', 'RW-01'],
            required: [true, 'RT harus dipilih'],
        },
        category: {
            type: String,
            enum: ['Keamanan', 'Kebersihan', 'Infrastruktur', 'Sosial', 'Administrasi', 'Lainnya'],
            required: [true, 'Kategori harus dipilih'],
        },
        allocatedAmount: {
            type: Number,
            required: [true, 'Jumlah alokasi anggaran harus diisi'],
            min: 0,
        },
        spentAmount: {
            type: Number,
            required: [true, 'Jumlah pengeluaran harus diisi'],
            min: 0,
            default: 0,
        },
        description: {
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
budgetSchema.index({ year: -1, rt: 1, category: 1 });
budgetSchema.index({ category: 1 });
budgetSchema.index({ rt: 1 });

// Virtual untuk menghitung sisa anggaran
budgetSchema.virtual('remainingAmount').get(function () {
    return this.allocatedAmount - this.spentAmount;
});

// Virtual untuk menghitung persentase penggunaan
budgetSchema.virtual('usagePercentage').get(function () {
    if (this.allocatedAmount === 0) return 0;
    return ((this.spentAmount / this.allocatedAmount) * 100).toFixed(1);
});

// Ensure virtuals are included when converting to JSON
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);
