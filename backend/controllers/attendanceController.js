const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');
const { notifyAllAdmins, createNotification, NotificationTemplates } = require('../utils/notificationHelper');

// @desc    Create attendance (User check-in)
// @route   POST /api/attendances
// @access  Private
exports.createAttendance = async (req, res) => {
  try {
    let { scheduleId, status, reason, location } = req.body;

    console.log('=== CREATE ATTENDANCE REQUEST ===');
    console.log('User:', req.user?.email);
    console.log('ScheduleId:', scheduleId);
    console.log('Status:', status);
    console.log('Location:', location);

    // Parse location if it's a JSON string (from FormData)
    if (location && typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Format lokasi tidak valid',
        });
      }
    }

    // Verify schedule exists
    if (!scheduleId) {
      return res.status(400).json({ success: false, message: 'Schedule ID wajib diisi' });
    }

    // Validate status
    const validStatuses = ['masuk', 'pulang', 'izin'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Pilih: ${validStatuses.join(', ')}`,
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    // Map masuk/pulang to hadir status for database storage
    const dbStatus = (status === 'masuk' || status === 'pulang') ? 'hadir' : 'izin';
    const type = status === 'masuk' ? 'masuk' : status === 'pulang' ? 'pulang' : 'izin';

    // Check if user already has attendance for this type today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      schedule: scheduleId,
      status: dbStatus,
      type: type,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ createdAt: -1 }); // Ambil yang paling baru jika ada duplikat

    // --- PERBAIKAN LOGIKA DI SINI ---
    // Hanya blokir jika ada data DAN statusnya BUKAN ditolak (artinya Pending atau Approved)
    if (existingAttendance && existingAttendance.approved !== false) {
      console.log('Attendance blocked because existing status is:', existingAttendance.approved);
      return res.status(400).json({
        success: false,
        message: `Anda sudah melakukan absensi ${type} hari ini untuk jadwal ini`,
      });
    }
    // Jika existingAttendance.approved === false, kode akan lanjut ke bawah (membuat data baru)

    let photoUrl = null;
    let photoPublicId = null;

    // Upload foto jika status masuk/pulang dan ada file
    if ((status === 'masuk' || status === 'pulang') && req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'jagakampung/attendance');
        photoUrl = result.secure_url;
        photoPublicId = result.public_id;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Gagal upload foto: ' + uploadError.message,
        });
      }
    }

    // Validate reason for izin status
    if (status === 'izin' && !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Alasan izin wajib diisi' });
    }

    const attendance = new Attendance({
      user: req.user._id,
      schedule: scheduleId,
      rt: req.user.rt,
      date: new Date(),
      status: dbStatus,
      type: type,
      photo: photoUrl,
      photoPublicId: photoPublicId,
      reason: status === 'izin' ? reason : null,
      location: location || null,
      approved: null // Reset approved status untuk data baru (Pending)
    });
    
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('user', 'name email rt photo')
      .populate('schedule');

    // Send notification to all admins
    const notifTemplate = NotificationTemplates.newAttendance(req.user.name, status);
    await notifyAllAdmins(
      notifTemplate.type,
      notifTemplate.title,
      notifTemplate.message,
      notifTemplate.link,
      { attendanceId: attendance._id, userId: req.user._id }
    );

    res.status(201).json({
      success: true,
      data: populatedAttendance,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all attendances
// @route   GET /api/attendances
// @access  Private/Admin
exports.getAllAttendances = async (req, res) => {
  try {
    const { rt, status, approved, startDate, endDate, month, year } = req.query;

    let filter = {};

    if (rt) filter.rt = rt;
    if (status) filter.status = status;
    if (approved !== undefined) filter.approved = approved === 'true';

    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendances = await Attendance.find(filter)
      .populate('user', 'name email rt photo')
      .populate('schedule')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    const stats = {
      total: attendances.length,
      hadir: attendances.filter(a => a.status === 'hadir').length,
      izin: attendances.filter(a => a.status === 'izin').length,
      approved: attendances.filter(a => a.approved).length,
      pending: attendances.filter(a => !a.approved).length,
    };

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user attendance history
// @route   GET /api/attendances/my-history
// @access  Private
exports.getMyAttendanceHistory = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const filter = { user: req.user._id };

    const yearNum = year && year !== 'semua' ? parseInt(year, 10) : null;
    const monthNum = month && month !== 'semua' ? parseInt(month, 10) : null;

    if (yearNum) {
      if (monthNum) {
        // Filter by specific year and month (1-12)
        const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
        const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
        filter.date = { $gte: startDate, $lte: endDate };
      } else {
        // Filter by entire year
        const startDate = new Date(Date.UTC(yearNum, 0, 1));
        const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
        filter.date = { $gte: startDate, $lte: endDate };
      }
    }

    const attendances = await Attendance.find(filter)
      .populate('schedule', 'name')
      .populate('approvedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    console.error('Error in getMyAttendanceHistory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching attendance history: ' + error.message 
    });
  }
};

// @desc    Approve/Reject attendance
// @route   PUT /api/attendances/:id/approve
// @access  Private/Admin
exports.approveAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Absensi tidak ditemukan' });
    }

    const { approved } = req.body;

    attendance.approved = approved;
    attendance.approvedBy = req.user._id;
    attendance.approvedAt = Date.now();

    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('user', 'name email rt photo')
      .populate('schedule')
      .populate('approvedBy', 'name email');

    try {
      const notifTemplate = NotificationTemplates.attendanceApproved(approved);
      await createNotification(
        attendance.user,
        notifTemplate.type,
        notifTemplate.title,
        notifTemplate.message,
        notifTemplate.link,
        { attendanceId: attendance._id, approved }
      );
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError.message);
    }

    res.status(200).json({ success: true, data: updatedAttendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete attendance
// @route   DELETE /api/attendances/:id
// @access  Private/Admin
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Absensi tidak ditemukan' });
    }
    if (attendance.photoPublicId) {
      await deleteFromCloudinary(attendance.photoPublicId);
    }
    await attendance.deleteOne();
    res.status(200).json({ success: true, message: 'Absensi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendances by RT
// @route   GET /api/attendances/rt/:rtNumber
// @access  Private
exports.getAttendancesByRT = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { rt: req.params.rtNumber };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendances = await Attendance.find(filter)
      .populate('user', 'name email rt photo')
      .populate('schedule')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if user has already attended today for a schedule
// @route   GET /api/attendances/check-today/:scheduleId
// @access  Private
exports.checkTodayAttendance = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get ALL attendances for today sorted by newest
    const attendances = await Attendance.find({
      user: req.user._id,
      schedule: scheduleId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('schedule')
      .sort({ date: -1 }); // Newest first

    // Logic frontend sudah disesuaikan untuk mengecek approved === false,
    // jadi backend cukup mengembalikan array lengkap.
    
    res.status(200).json({
      success: true,
      hasAttended: attendances.length > 0,
      attendances: attendances, 
      attendance: attendances.length > 0 ? attendances[0] : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};