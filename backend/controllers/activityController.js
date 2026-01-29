const Activity = require('../models/Activity');
const fs = require('fs').promises;
const path = require('path');

// Helper function untuk save file dari buffer
const saveActivityPhoto = async (file) => {
    const uploadDir = path.join(__dirname, '../uploads/activities');

    // Ensure directory exists
    try {
        await fs.access(uploadDir);
    } catch {
        await fs.mkdir(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `activity-${timestamp}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);
    return `/uploads/activities/${filename}`;
};

// Helper function untuk delete file
const deleteActivityPhoto = async (photoPath) => {
    if (!photoPath) return;

    try {
        const filepath = path.join(__dirname, '..', photoPath);
        await fs.unlink(filepath);
    } catch (error) {
        console.error('Error deleting photo:', error.message);
    }
};

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
exports.getAllActivities = async (req, res) => {
    try {
        const { rt, status, category, limit = 10, page = 1, isDocumentationFeed } = req.query;
        let filter = {};

        // Filter by RT (user can filter or see all)
        if (rt && rt !== 'Semua RT') {
            filter.$or = [
                { rt: rt },
                { rt: 'Semua RT' }
            ];
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Documentation Feed Specific Logic
        if (isDocumentationFeed === 'true') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            filter.documentation = { $exists: true, $not: { $size: 0 } }; // Must have documentation
            // filter.createdAt = { $gte: sevenDaysAgo }; // Only last 7 days (optional, based on requirement)
            // User requested: "sudah lebih dari 1 pekan/minggu isi kontenya itu otomatis hilang dari halaman mobile"
            // Assuming this means created date or event date. Let's use eventDate or createdAt. CreatedAt is safer for "upload time".
            // Actually user said "hilang dari halaman mobile".
            filter.createdAt = { $gte: sevenDaysAgo };
        }

        const activities = await Activity.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 }) // Newest first for feed
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await Activity.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: activities,
        });
    } catch (error) {
        console.error('Error in getAllActivities:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single activity by ID
// @route   GET /api/activities/:id
// @access  Private
exports.getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Kegiatan tidak ditemukan',
            });
        }

        res.status(200).json({
            success: true,
            data: activity,
        });
    } catch (error) {
        console.error('Error in getActivityById:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private/Admin
exports.createActivity = async (req, res) => {
    try {
        const { title, description, time, location, rt, eventDate, status, category } = req.body;

        // Validation based on category
        const activityCategory = category || 'activity';

        if (!title || !rt || !eventDate) {
            return res.status(400).json({
                success: false,
                message: 'Judul, RT, dan tanggal harus diisi',
            });
        }

        // Additional validation for activity (not documentation)
        if (activityCategory === 'activity' && (!description || !time || !location)) {
            return res.status(400).json({
                success: false,
                message: 'Deskripsi, jam, dan lokasi harus diisi untuk kegiatan',
            });
        }

        let photoPath = null;
        let documentationPaths = [];

        // Handle single photo (banner)
        if (req.files && req.files.photo) {
            photoPath = await saveActivityPhoto(req.files.photo[0]);
        }

        // Handle documentation photos
        if (req.files && req.files.documentation) {
            for (const file of req.files.documentation) {
                const docPath = await saveActivityPhoto(file);
                documentationPaths.push(docPath);
            }
        }

        const activity = await Activity.create({
            title,
            description: description || (activityCategory === 'documentation' ? `Dokumentasi kegiatan ${title}` : undefined),
            time: time || undefined,
            location: location || undefined,
            photo: photoPath,
            documentation: documentationPaths,
            rt,
            eventDate,
            status: status || 'upcoming',
            category: activityCategory,
            createdBy: req.user._id,
        });

        const populatedActivity = await Activity.findById(activity._id)
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedActivity,
            message: activityCategory === 'documentation' ? 'Dokumentasi berhasil dibuat' : 'Kegiatan berhasil dibuat',
        });
    } catch (error) {
        console.error('Error in createActivity:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private/Admin
exports.updateActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Kegiatan tidak ditemukan',
            });
        }

        const { title, description, time, location, rt, eventDate, status, category } = req.body;
        const oldPhotoPath = activity.photo;

        // Update fields
        if (title) activity.title = title;
        if (category) activity.category = category;

        // Only update description, time, location if category is activity
        const currentCategory = category || activity.category || 'activity';
        if (currentCategory === 'activity') {
            if (description) activity.description = description;
            if (time) activity.time = time;
            if (location) activity.location = location;
        } else {
            // For documentation, auto-generate description if not provided
            if (description) {
                activity.description = description;
            } else if (title && !activity.description) {
                activity.description = `Dokumentasi kegiatan ${title}`;
            }
        }

        if (rt) activity.rt = rt;
        if (eventDate) activity.eventDate = eventDate;
        if (status) activity.status = status;

        // Handle photo update (banner)
        if (req.files && req.files.photo) {
            // Delete old photo if exists
            if (oldPhotoPath) {
                await deleteActivityPhoto(oldPhotoPath);
            }
            // Save new photo
            activity.photo = await saveActivityPhoto(req.files.photo[0]);
        }

        // Handle documentation update
        // Note: Currently purely argumentative / appending. 
        // Realistically usually you'd want to replace or add.
        // For simplicity, let's append if new ones are uploaded.
        // Or if user wants to "reset", they might need a separate delete endpoint/logic.
        // Given the requirement "hanya tambahkan fungsi upload", replacing/adding is fine.
        // Let's assume uploading documentation ADDS to existing.
        if (req.files && req.files.documentation) {
            // If user uploads documentation, do we replace or append?
            // Usually replace is safer for simple CRUD unless "add more" button exists.
            // But let's append for now as it's safer than deleting history unintendedly.
            // WAIT, if max is 10, maybe we should just replace?
            // "Maximum content is 10". Is that 10 activities or 10 photos per activity?
            // "maksimal contentnya itu sepuluh" likely refers to the FEED (10 items).
            // But for photos? "upload dokumentasi kegiatan" suggests a batch.
            // Let's just append for now.
            for (const file of req.files.documentation) {
                const docPath = await saveActivityPhoto(file);
                activity.documentation.push(docPath);
            }
        }

        await activity.save();

        const updatedActivity = await Activity.findById(activity._id)
            .populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: updatedActivity,
            message: currentCategory === 'documentation' ? 'Dokumentasi berhasil diperbarui' : 'Kegiatan berhasil diperbarui',
        });
    } catch (error) {
        console.error('Error in updateActivity:', error);
        res.status(500).json({ // Fixed syntax error here
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private/Admin
exports.deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Kegiatan tidak ditemukan',
            });
        }

        // Delete photo if exists
        if (activity.photo) {
            await deleteActivityPhoto(activity.photo);
        }

        await activity.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Kegiatan berhasil dihapus',
        });
    } catch (error) {
        console.error('Error in deleteActivity:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Upload documentation to existing activity
// @route   POST /api/activities/:id/documentation
// @access  Private/Admin
exports.uploadDocumentation = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Kegiatan tidak ditemukan',
            });
        }

        if (!req.files || !req.files.documentation) {
            return res.status(400).json({
                success: false,
                message: 'Pilih minimal 1 foto dokumentasi',
            });
        }

        // Upload new documentation photos
        for (const file of req.files.documentation) {
            const docPath = await saveActivityPhoto(file);
            activity.documentation.push(docPath);
        }

        await activity.save();

        const updatedActivity = await Activity.findById(activity._id)
            .populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: updatedActivity,
            message: 'Dokumentasi berhasil diupload',
        });
    } catch (error) {
        console.error('Error in uploadDocumentation:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
