const Budget = require('../models/Budget');

// [CRUD - READ] Mengambil semua data anggaran
// @desc    Get all budget records
// @route   GET /api/budgets
// @access  Private
exports.getAllBudgets = async (req, res) => {
    try {
        const { year, rt, category, limit = 50, page = 1 } = req.query;
        let filter = {};

        if (year) filter.year = parseInt(year);
        if (rt) filter.rt = rt;
        if (category) filter.category = category;

        const budgetRecords = await Budget.find(filter)
            .populate('createdBy', 'name email')
            .sort({ year: -1, category: 1, rt: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await Budget.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: budgetRecords.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: budgetRecords,
        });
    } catch (error) {
        console.error('Error in getAllBudgets:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// [CRUD - READ (SUMMARY)] Mengambil ringkasan anggaran
// @desc    Get budget summary for dashboard
// @route   GET /api/budgets/summary
// @access  Private
exports.getBudgetSummary = async (req, res) => {
    try {
        const { year } = req.query;
        let filter = {};

        if (year) filter.year = parseInt(year);

        // Get all budget records for the specified period
        const budgetRecords = await Budget.find(filter).lean();

        // Group by category
        const byCategory = budgetRecords.reduce((acc, record) => {
            const existing = acc.find(item => item.category === record.category);
            if (existing) {
                existing.allocatedAmount += record.allocatedAmount;
                existing.spentAmount += record.spentAmount;
            } else {
                acc.push({
                    category: record.category,
                    allocatedAmount: record.allocatedAmount,
                    spentAmount: record.spentAmount,
                });
            }
            return acc;
        }, []);

        // Calculate totals
        const summary = {
            totalAllocated: budgetRecords.reduce((sum, record) => sum + record.allocatedAmount, 0),
            totalSpent: budgetRecords.reduce((sum, record) => sum + record.spentAmount, 0),
            byCategory,
            allRecords: budgetRecords,
        };

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('Error in getBudgetSummary:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// [CRUD - READ (DETAIL)] Mengambil satu data anggaran berdasarkan ID
// @desc    Get single budget record by ID
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudgetById = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Data anggaran tidak ditemukan',
            });
        }

        res.status(200).json({
            success: true,
            data: budget,
        });
    } catch (error) {
        console.error('Error in getBudgetById:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// [CRUD - CREATE] Menambahkan data anggaran baru
// @desc    Create new budget record
// @route   POST /api/budgets
// @access  Private/Admin
exports.createBudget = async (req, res) => {
    try {
        const {
            year,
            rt,
            category,
            allocatedAmount,
            spentAmount,
            description,
        } = req.body;

        if (!year || !rt || !category || allocatedAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Tahun, RT, kategori, dan jumlah alokasi harus diisi',
            });
        }

        const budget = await Budget.create({
            year: parseInt(year),
            rt,
            category,
            allocatedAmount: parseFloat(allocatedAmount),
            spentAmount: parseFloat(spentAmount) || 0,
            description: description || '',
            createdBy: req.user._id,
        });

        const populatedBudget = await Budget.findById(budget._id)
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedBudget,
            message: 'Data anggaran berhasil dibuat',
            // [NOTE] Ini adalah respon sukses setelah CREATE
        });
    } catch (error) {
        console.error('Error in createBudget:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// [CRUD - UPDATE] Mengubah data anggaran
// @desc    Update budget record
// @route   PUT /api/budgets/:id
// @access  Private/Admin
exports.updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Data anggaran tidak ditemukan',
            });
        }

        const {
            year,
            rt,
            category,
            allocatedAmount,
            spentAmount,
            description,
        } = req.body;

        // Update fields
        if (year) budget.year = parseInt(year);
        if (rt) budget.rt = rt;
        if (category) budget.category = category;
        if (allocatedAmount !== undefined) budget.allocatedAmount = parseFloat(allocatedAmount);
        if (spentAmount !== undefined) budget.spentAmount = parseFloat(spentAmount);
        if (description !== undefined) budget.description = description;

        await budget.save();

        const updatedBudget = await Budget.findById(budget._id)
            .populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: updatedBudget,
            message: 'Data anggaran berhasil diperbarui',
        });
    } catch (error) {
        console.error('Error in updateBudget:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// [CRUD - DELETE] Menghapus data anggaran
// @desc    Delete budget record
// @route   DELETE /api/budgets/:id
// @access  Private/Admin
exports.deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Data anggaran tidak ditemukan',
            });
        }

        await budget.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Data anggaran berhasil dihapus',
        });
    } catch (error) {
        console.error('Error in deleteBudget:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
