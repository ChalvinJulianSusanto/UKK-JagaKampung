const AttendanceRecap = require('../models/AttendanceRecap');
const { uploadToLocal, deleteFromLocal } = require('../utils/uploadLocal');

// Create new attendance recap
exports.createRecap = async (req, res) => {
    try {
        const { rt, date, time, guards } = req.body;

        // Validate required fields
        if (!rt || !date || !time || !guards) {
            return res.status(400).json({
                success: false,
                message: 'RT, tanggal, waktu, dan petugas harus diisi'
            });
        }

        // Check if photo was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Foto bukti harus di-upload'
            });
        }

        // Parse guards if it's a string (comma separated or JSON array)
        let guardsArray;
        if (typeof guards === 'string') {
            try {
                guardsArray = JSON.parse(guards);
            } catch (e) {
                // If not JSON, split by comma
                guardsArray = guards.split(',').map(g => g.trim()).filter(g => g);
            }
        } else if (Array.isArray(guards)) {
            guardsArray = guards;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Format petugas tidak valid'
            });
        }

        // Upload photo to local storage
        let photoUrl;
        try {
            const uploadResult = await uploadToLocal(req.file.buffer, 'recaps');
            photoUrl = uploadResult.secure_url;
        } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengupload foto'
            });
        }

        // Create recap
        const recap = new AttendanceRecap({
            rt,
            date: new Date(date),
            time,
            guards: guardsArray,
            photo: photoUrl,
            createdBy: req.user._id
        });

        await recap.save();

        res.status(201).json({
            success: true,
            message: 'Rekap kehadiran berhasil ditambahkan',
            data: recap
        });
    } catch (error) {
        console.error('Error creating recap:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Gagal menambahkan rekap kehadiran'
        });
    }
};

// Get all recaps with filters
exports.getAllRecaps = async (req, res) => {
    try {
        const { rt, date, startDate, endDate, limit = 50, page = 1 } = req.query;

        const query = {};

        // Filter by RT
        if (rt && rt !== 'all') {
            query.rt = rt;
        }

        // Filter by specific date
        if (date) {
            const dateObj = new Date(date);
            const nextDay = new Date(dateObj);
            nextDay.setDate(nextDay.getDate() + 1);
            query.date = { $gte: dateObj, $lt: nextDay };
        }

        // Filter by date range
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [recaps, total] = await Promise.all([
            AttendanceRecap.find(query)
                .sort({ date: -1, createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .populate('createdBy', 'name email'),
            AttendanceRecap.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: recaps,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching recaps:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data rekap kehadiran'
        });
    }
};

// Get today's recaps
exports.getTodayRecaps = async (req, res) => {
    try {
        const { rt } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const query = {
            date: { $gte: today, $lt: tomorrow }
        };

        // Filter by RT if provided
        if (rt && rt !== 'all') {
            query.rt = rt;
        }

        const recaps = await AttendanceRecap.find(query)
            .sort({ time: 1 })
            .populate('createdBy', 'name');

        res.json({
            success: true,
            data: recaps
        });
    } catch (error) {
        console.error('Error fetching today recaps:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data rekap hari ini'
        });
    }
};

// Get single recap by ID
exports.getRecapById = async (req, res) => {
    try {
        const recap = await AttendanceRecap.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!recap) {
            return res.status(404).json({
                success: false,
                message: 'Rekap tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: recap
        });
    } catch (error) {
        console.error('Error fetching recap:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data rekap'
        });
    }
};

// Update recap
exports.updateRecap = async (req, res) => {
    try {
        const { rt, date, time, guards } = req.body;
        const recap = await AttendanceRecap.findById(req.params.id);

        if (!recap) {
            return res.status(404).json({
                success: false,
                message: 'Rekap tidak ditemukan'
            });
        }

        // Update fields
        if (rt) recap.rt = rt;
        if (date) recap.date = new Date(date);
        if (time) recap.time = time;

        if (guards) {
            let guardsArray;
            if (typeof guards === 'string') {
                try {
                    guardsArray = JSON.parse(guards);
                } catch (e) {
                    guardsArray = guards.split(',').map(g => g.trim()).filter(g => g);
                }
            } else if (Array.isArray(guards)) {
                guardsArray = guards;
            }
            if (guardsArray) recap.guards = guardsArray;
        }

        // Update photo if new one is uploaded
        if (req.file) {
            // Upload new photo
            try {
                const uploadResult = await uploadToLocal(req.file.buffer, 'recaps');

                // Delete old photo
                if (recap.photo) {
                    try {
                        // Extract public_id from URL (assumes format /uploads/folder/filename)
                        const publicId = recap.photo.replace('/uploads/', '');
                        await deleteFromLocal(publicId);
                    } catch (error) {
                        console.error('Error deleting old photo:', error);
                    }
                }

                recap.photo = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Error uploading new photo:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengupload foto baru'
                });
            }
        }

        await recap.save();

        res.json({
            success: true,
            message: 'Rekap berhasil diperbarui',
            data: recap
        });
    } catch (error) {
        console.error('Error updating recap:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui rekap'
        });
    }
};

// Delete recap
exports.deleteRecap = async (req, res) => {
    try {
        const recap = await AttendanceRecap.findById(req.params.id);

        if (!recap) {
            return res.status(404).json({
                success: false,
                message: 'Rekap tidak ditemukan'
            });
        }

        // Delete photo file
        if (recap.photo) {
            try {
                const publicId = recap.photo.replace('/uploads/', '');
                await deleteFromLocal(publicId);
            } catch (error) {
                console.error('Error deleting photo:', error);
            }
        }

        await AttendanceRecap.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Rekap berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting recap:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus rekap'
        });
    }
};
