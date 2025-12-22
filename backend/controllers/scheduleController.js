const Schedule = require('../models/Schedule');
const { notifyUsersByRT, notifyUserByEmail, NotificationTemplates } = require('../utils/notificationHelper');

// @desc    Create schedule container for a month
// @route   POST /api/schedules
// @access  Private/Admin
exports.createSchedule = async (req, res) => {
  try {
    const { rt, month, year } = req.body;

    // Normalize RT to two-character string (e.g. 4 -> '04') to avoid validation/enum mismatches
    const rtStr = typeof rt === 'number' ? String(rt).padStart(2, '0') : String(rt).padStart(2, '0');

    if (!rtStr || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'RT, bulan dan tahun harus diisi',
      });
    }

    const existingSchedule = await Schedule.findOne({
      rt: rtStr,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Jadwal untuk RT, bulan dan tahun ini sudah ada',
      });
    }

    const schedule = await Schedule.create({
      rt: rtStr,
      month: parseInt(month),
      year: parseInt(year),
      entries: [],
      createdBy: req.user._id,
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedSchedule,
    });
  } catch (error) {
    // Log detailed context to help diagnose RT-specific failures
    console.error('Error in createSchedule:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user ? req.user._id : null,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private
exports.getAllSchedules = async (req, res) => {
  try {
    const { year, rt, month } = req.query;
    let filter = {};

    if (year) filter.year = parseInt(year);
    if (rt) filter.rt = rt;
    if (month) filter.month = parseInt(month);

    const schedules = await Schedule.find(filter)
      .populate('createdBy', 'name email')
      .sort({ year: -1, month: -1, rt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get schedule by ID
// @route   GET /api/schedules/:id
// @access  Private
exports.getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get schedule by RT, month and year
// @route   GET /api/schedules/month/:rt/:year/:month
// @access  Private
exports.getScheduleByMonth = async (req, res) => {
  try {
    const { rt, year, month } = req.params;

    const schedule = await Schedule.findOne({
      rt,
      year: parseInt(year),
      month: parseInt(month),
    }).populate('createdBy', 'name email');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private/Admin
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan',
      });
    }

    await schedule.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Jadwal berhasil dihapus',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add entry to schedule
// @route   POST /api/schedules/:id/entries
// @access  Private/Admin
exports.addEntry = async (req, res) => {
  try {
    console.log('[addEntry] Request received:', { scheduleId: req.params.id, body: req.body });

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan',
      });
    }

    // Ensure createdBy is set (in case it was lost or is null)
    if (!schedule.createdBy) {
      console.warn('[addEntry] createdBy is missing, setting to current user');
      schedule.createdBy = req.user._id;
    }

    const { guardName, date, day, phone, notes, email } = req.body;

    if (!guardName || !date || !day) {
      return res.status(400).json({
        success: false,
        message: 'Nama penjaga, tanggal, dan hari harus diisi',
      });
    }

    // Validate day enum
    const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: `Hari tidak valid. Harus salah satu dari: ${validDays.join(', ')}`,
      });
    }

    // Validate date range
    const dateNum = parseInt(date);
    if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal harus berupa angka antara 1-31',
      });
    }

    console.log('[addEntry] Adding entry to schedule:', { guardName, date: dateNum, day, phone, notes, email });

    await schedule.addEntry({ guardName, date: dateNum, day, phone, notes, email });

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate('createdBy', 'name email');

    console.log('[addEntry] Entry added successfully, schedule has', updatedSchedule.entries.length, 'entries');

    // Send notification to user by email (if email provided)
    if (email) {
      try {
        const notifTemplate = NotificationTemplates.newScheduleUploaded(
          schedule.rt,
          schedule.month,
          schedule.year
        );
        console.log('[addEntry] Sending notification to email:', email);

        await notifyUserByEmail(
          email,
          notifTemplate.type,
          notifTemplate.title,
          `Anda telah ditambahkan ke jadwal ronda\nRT ${schedule.rt} pada ${day}, ${String(dateNum).padStart(2, '0')}/${String(schedule.month).padStart(2, '0')}/${schedule.year}`,
          notifTemplate.link,
          { scheduleId: schedule._id, guardName, date: dateNum }
        );
      } catch (notifErr) {
        console.error('Failed to notify user by email:', {
          error: notifErr.message,
          stack: notifErr.stack,
          scheduleId: schedule._id,
          email,
        });
        // Do not throw - continue to return success for schedule add
      }
    }

    res.status(200).json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) {
    // Detailed logging to help debug RT-specific 500 errors
    console.error('Error in addEntry:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
      user: req.user ? req.user._id : null,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update entry in schedule
// @route   PUT /api/schedules/:id/entries/:entryId
// @access  Private/Admin
exports.updateEntry = async (req, res) => {
  try {
    console.log('[updateEntry] Request received:', { scheduleId: req.params.id, entryId: req.params.entryId, body: req.body });

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan',
      });
    }

    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = parseInt(updateData.date);
    }

    await schedule.updateEntry(req.params.entryId, updateData);

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate('createdBy', 'name email');

    console.log('[updateEntry] Entry updated successfully');

    res.status(200).json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error('Error in updateEntry:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete entry from schedule
// @route   DELETE /api/schedules/:id/entries/:entryId
// @access  Private/Admin
exports.deleteEntry = async (req, res) => {
  try {
    console.log('[deleteEntry] Request received:', { scheduleId: req.params.id, entryId: req.params.entryId });

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal tidak ditemukan',
      });
    }

    await schedule.deleteEntry(req.params.entryId);

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate('createdBy', 'name email');

    console.log('[deleteEntry] Entry deleted successfully');

    res.status(200).json({
      success: true,
      data: updatedSchedule,
    });
  } catch (error) {
    console.error('Error in deleteEntry:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get today's patrol partners for current user
// @route   GET /api/schedules/today-partner
// @access  Private
exports.getTodayPartner = async (req, res) => {
  try {
    const User = require('../models/User');
    const userEmail = req.user.email;

    // Normalize RT to 2 digits (e.g., "5" -> "05") to match database format
    const userRT = String(req.user.rt).padStart(2, '0');

    // Get current date in Jakarta Time (WIB)
    // using 'id-ID' locale or specific timezone offset
    const now = new Date();
    const jakartaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

    const currentYear = jakartaDate.getFullYear();
    const currentMonth = jakartaDate.getMonth() + 1; // 1-12
    const currentDate = jakartaDate.getDate(); // 1-31

    // Find schedule for user's RT and current month
    const schedule = await Schedule.findOne({
      rt: userRT,
      year: currentYear,
      month: currentMonth,
    });

    if (!schedule) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Tidak ada jadwal untuk bulan ini',
      });
    }

    // Find all entries with today's date
    const todayEntries = schedule.entries.filter(
      (entry) => entry.date === currentDate
    );

    if (todayEntries.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Tidak ada jadwal ronda hari ini',
      });
    }

    // Check if current user is in today's schedule
    // If user is not scheduled, they shouldn't see partners
    const isUserScheduled = todayEntries.some(
      (entry) => entry.email && entry.email.toLowerCase() === userEmail.toLowerCase()
    );

    if (!isUserScheduled) {
      return res.status(200).json({
        success: true,
        data: [], // Return empty if user is not on duty
        message: 'Anda tidak ada jadwal ronda hari ini',
      });
    }

    // Filter out current user and get partners with photo
    const partnerPromises = todayEntries
      .filter((entry) => entry.email && entry.email.toLowerCase() !== userEmail.toLowerCase())
      .map(async (entry) => {
        // Try to find user by email to get photo
        const user = await User.findOne({ email: entry.email }).select('name email photo');

        return {
          guardName: entry.guardName,
          email: entry.email || '',
          phone: entry.phone || '',
          photo: user?.photo || null,
          date: entry.date,
          day: entry.day,
        };
      });

    const partners = await Promise.all(partnerPromises);

    res.status(200).json({
      success: true,
      data: partners,
      count: partners.length,
    });
  } catch (error) {
    console.error('Error in getTodayPartner:', {
      message: error.message,
      stack: error.stack,
      user: req.user ? req.user._id : null,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};