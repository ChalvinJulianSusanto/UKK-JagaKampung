const Iuran = require('../models/Iuran');

// @desc    Get all iuran records
// @route   GET /api/iuran
// @access  Private
exports.getAllIuran = async (req, res) => {
    try {
        const { month, year, rt, limit = 50, page = 1 } = req.query;
        let filter = {};

        if (month) filter.month = month;
        if (year) filter.year = parseInt(year);
        if (rt) filter.rt = rt;

        const iuranRecords = await Iuran.find(filter)
            .populate('createdBy', 'name email')
            .sort({ year: -1, month: -1, rt: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await Iuran.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: iuranRecords.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: iuranRecords,
        });
    } catch (error) {
        console.error('Error in getAllIuran:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get iuran summary for dashboard
// @route   GET /api/iuran/summary
// @access  Private
exports.getIuranSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        let filter = {};

        if (month) filter.month = month;
        if (year) filter.year = parseInt(year);

        // Get all iuran records for the specified period
        const iuranRecords = await Iuran.find(filter).lean();

        // Calculate totals
        const summary = {
            totalTarget: iuranRecords.reduce((sum, record) => sum + record.targetAmount, 0),
            totalCollected: iuranRecords.reduce((sum, record) => sum + record.collectedAmount, 0),
            totalResidents: iuranRecords.reduce((sum, record) => sum + record.totalResidents, 0),
            totalPaidResidents: iuranRecords.reduce((sum, record) => sum + record.paidResidents, 0),
            byRT: iuranRecords,
        };

        res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('Error in getIuranSummary:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single iuran record by ID
// @route   GET /api/iuran/:id
// @access  Private
exports.getIuranById = async (req, res) => {
    try {
        const iuran = await Iuran.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!iuran) {
            return res.status(404).json({
                success: false,
                message: 'Data iuran tidak ditemukan',
            });
        }

        res.status(200).json({
            success: true,
            data: iuran,
        });
    } catch (error) {
        console.error('Error in getIuranById:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create new iuran record
// @route   POST /api/iuran
// @access  Private/Admin
exports.createIuran = async (req, res) => {
    try {
        const {
            month,
            year,
            rt,
            targetAmount,
            collectedAmount,
            totalResidents,
            paidResidents,
            notes,
        } = req.body;

        if (!month || !year || !rt || targetAmount === undefined || totalResidents === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Bulan, tahun, RT, target iuran, dan jumlah warga harus diisi',
            });
        }

        // Check if iuran for this month, year, and RT already exists
        const existingIuran = await Iuran.findOne({ month, year: parseInt(year), rt });
        if (existingIuran) {
            return res.status(400).json({
                success: false,
                message: `Data iuran untuk RT ${rt} bulan ${month} tahun ${year} sudah ada`,
            });
        }

        const iuran = await Iuran.create({
            month,
            year: parseInt(year),
            rt,
            targetAmount: parseFloat(targetAmount),
            collectedAmount: parseFloat(collectedAmount) || 0,
            totalResidents: parseInt(totalResidents),
            paidResidents: parseInt(paidResidents) || 0,
            notes: notes || '',
            createdBy: req.user._id,
        });

        const populatedIuran = await Iuran.findById(iuran._id)
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedIuran,
            message: 'Data iuran berhasil dibuat',
        });
    } catch (error) {
        console.error('Error in createIuran:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update iuran record
// @route   PUT /api/iuran/:id
// @access  Private/Admin
exports.updateIuran = async (req, res) => {
    try {
        const iuran = await Iuran.findById(req.params.id);

        if (!iuran) {
            return res.status(404).json({
                success: false,
                message: 'Data iuran tidak ditemukan',
            });
        }

        const {
            month,
            year,
            rt,
            targetAmount,
            collectedAmount,
            totalResidents,
            paidResidents,
            notes,
        } = req.body;

        // Update fields
        if (month) iuran.month = month;
        if (year) iuran.year = parseInt(year);
        if (rt) iuran.rt = rt;
        if (targetAmount !== undefined) iuran.targetAmount = parseFloat(targetAmount);
        if (collectedAmount !== undefined) iuran.collectedAmount = parseFloat(collectedAmount);
        if (totalResidents !== undefined) iuran.totalResidents = parseInt(totalResidents);
        if (paidResidents !== undefined) iuran.paidResidents = parseInt(paidResidents);
        if (notes !== undefined) iuran.notes = notes;

        await iuran.save();

        const updatedIuran = await Iuran.findById(iuran._id)
            .populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: updatedIuran,
            message: 'Data iuran berhasil diperbarui',
        });
    } catch (error) {
        console.error('Error in updateIuran:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete iuran record
// @route   DELETE /api/iuran/:id
// @access  Private/Admin
exports.deleteIuran = async (req, res) => {
    try {
        const iuran = await Iuran.findById(req.params.id);

        if (!iuran) {
            return res.status(404).json({
                success: false,
                message: 'Data iuran tidak ditemukan',
            });
        }

        await iuran.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Data iuran berhasil dihapus',
        });
    } catch (error) {
        console.error('Error in deleteIuran:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
