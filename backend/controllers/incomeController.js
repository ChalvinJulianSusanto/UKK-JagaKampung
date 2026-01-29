const Income = require('../models/Income');

// Get all income records with filters
exports.getAllIncome = async (req, res) => {
    try {
        const { year, month, category, rt } = req.query;
        const filter = {};

        if (year) filter.year = parseInt(year);
        if (month) filter.month = month;
        if (category) filter.category = category;
        if (rt) filter.rt = rt;

        const incomeRecords = await Income.find(filter)
            .sort({ date: -1 })
            .lean();

        res.json({
            success: true,
            data: incomeRecords
        });
    } catch (error) {
        console.error('Error fetching income:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memuat data pemasukan'
        });
    }
};

// Get income summary
exports.getIncomeSummary = async (req, res) => {
    try {
        const { year, month } = req.query;
        const filter = {};

        if (year) filter.year = parseInt(year);
        if (month) filter.month = month;

        // Total per category
        const byCategory = await Income.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Total per RT
        const byRT = await Income.aggregate([
            { $match: { ...filter, rt: { $ne: null } } },
            {
                $group: {
                    _id: '$rt',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Grand total
        const grandTotal = await Income.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                byCategory,
                byRT,
                total: grandTotal[0]?.total || 0,
                count: grandTotal[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Error fetching income summary:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memuat ringkasan pemasukan'
        });
    }
};

// Create new income record
exports.createIncome = async (req, res) => {
    try {
        const { category, amount, date, description, rt, year, month } = req.body;

        // Validation
        if (!category || !amount || !description || !year || !month) {
            return res.status(400).json({
                success: false,
                message: 'Semua field wajib diisi'
            });
        }

        const income = new Income({
            category,
            amount,
            date: date || new Date(),
            description,
            rt: rt || null,
            year,
            month
        });

        await income.save();

        res.status(201).json({
            success: true,
            message: 'Data pemasukan berhasil ditambahkan',
            data: income
        });
    } catch (error) {
        console.error('Error creating income:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan data pemasukan'
        });
    }
};

// Update income record
exports.updateIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, amount, date, description, rt, year, month } = req.body;

        const income = await Income.findByIdAndUpdate(
            id,
            {
                category,
                amount,
                date,
                description,
                rt: rt || null,
                year,
                month
            },
            { new: true, runValidators: true }
        );

        if (!income) {
            return res.status(404).json({
                success: false,
                message: 'Data pemasukan tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Data pemasukan berhasil diperbarui',
            data: income
        });
    } catch (error) {
        console.error('Error updating income:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data pemasukan'
        });
    }
};

// Delete income record
exports.deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;

        const income = await Income.findByIdAndDelete(id);

        if (!income) {
            return res.status(404).json({
                success: false,
                message: 'Data pemasukan tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Data pemasukan berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting income:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus data pemasukan'
        });
    }
};
