const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const { exportAttendanceToExcel } = require('../utils/excelExport');
const { exportAttendanceToPDF } = require('../utils/pdfExport');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const { rt, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Total Users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Total Users per RT
    const usersByRT = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $group: {
          _id: '$rt',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total Attendances - Count unique user-days (masuk + pulang = 1 attendance)
    let attendanceFilter = { ...dateFilter };
    if (rt) attendanceFilter.rt = rt;

    const attendanceAgg = await Attendance.aggregate([
      { $match: attendanceFilter },
      // Step 1: Group by user and date to get unique user-days
      {
        $group: {
          _id: {
            user: '$user',
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          },
          recordCount: { $sum: 1 },
          hasHadir: {
            $max: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] }
          },
        },
      },
      // Step 2: Count only complete attendances (masuk + pulang)
      {
        $group: {
          _id: null,
          total: {
            $sum: { $cond: [{ $and: [{ $gte: ['$recordCount', 2] }, { $eq: ['$hasHadir', 1] }] }, 1, 0] }
          },
        },
      },
    ]);

    const totalAttendances = attendanceAgg.length > 0 ? attendanceAgg[0].total : 0;

    // Attendance by status
    const attendanceByStatus = await Attendance.aggregate([
      { $match: attendanceFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Attendance by RT - Count unique user-days per RT
    const attendanceByRT = await Attendance.aggregate([
      { $match: dateFilter },
      // Step 1: Group by user, date, and RT to get unique user-days
      {
        $group: {
          _id: {
            user: '$user',
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            rt: '$rt',
          },
          recordCount: { $sum: 1 },
          hasHadir: {
            $max: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] }
          },
        },
      },
      // Step 2: Group by RT and count complete attendances
      {
        $group: {
          _id: '$_id.rt',
          total: {
            $sum: { $cond: [{ $and: [{ $gte: ['$recordCount', 2] }, { $eq: ['$hasHadir', 1] }] }, 1, 0] }
          },
          hadir: {
            $sum: { $cond: [{ $and: [{ $gte: ['$recordCount', 2] }, { $eq: ['$hasHadir', 1] }] }, 1, 0] }
          },
          izin: { $sum: 0 }, // izin handled separately if needed
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pending approvals
    const pendingApprovals = await Attendance.countDocuments({
      approved: false,
      status: 'hadir',
    });

    // Recent attendances
    const recentAttendances = await Attendance.find(attendanceFilter)
      .populate('user', 'name rt photo')
      .populate('schedule')
      .sort({ createdAt: -1 })
      .limit(10);

    // Total Schedules - hitung hanya schedule dengan struktur baru (ada field rt)
    let scheduleFilter = { rt: { $exists: true } };
    if (rt) scheduleFilter.rt = rt;

    const totalSchedules = await Schedule.countDocuments(scheduleFilter);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        usersByRT,
        totalAttendances,
        attendanceByStatus,
        attendanceByRT,
        pendingApprovals,
        recentAttendances,
        totalSchedules,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get attendance statistics by week
// @route   GET /api/dashboard/weekly-stats
// @access  Private/Admin
exports.getWeeklyStats = async (req, res) => {
  try {
    const { rt } = req.query;

    // Get last 4 weeks data
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    let filter = {
      date: { $gte: fourWeeksAgo },
    };

    if (rt) filter.rt = rt;

    const weeklyData = await Attendance.aggregate([
      { $match: filter },
      // Step 1: Group by user, date, week, year to get unique user-days
      {
        $group: {
          _id: {
            user: '$user',
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            week: { $week: '$date' },
            year: { $year: '$date' },
          },
          // Count how many records (masuk/pulang) for this user on this day
          recordCount: { $sum: 1 },
          // Track if they have 'hadir' status
          hasHadir: {
            $max: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] }
          },
        },
      },
      // Step 2: Group by week/year to count unique attendances
      {
        $group: {
          _id: {
            week: '$_id.week',
            year: '$_id.year',
          },
          // Count users who have at least 2 records (masuk + pulang) with hadir status
          count: {
            $sum: { $cond: [{ $and: [{ $gte: ['$recordCount', 2] }, { $eq: ['$hasHadir', 1] }] }, 1, 0] }
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: weeklyData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get attendance statistics by month
// @route   GET /api/dashboard/monthly-stats
// @access  Private/Admin
exports.getMonthlyStats = async (req, res) => {
  try {
    const { rt } = req.query;

    // Get last 6 months data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let filter = {
      date: { $gte: sixMonthsAgo },
    };

    if (rt) filter.rt = rt;

    const monthlyData = await Attendance.aggregate([
      { $match: filter },
      // Step 1: Group by user, date, month, year to get unique user-days
      {
        $group: {
          _id: {
            user: '$user',
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            month: { $month: '$date' },
            year: { $year: '$date' },
          },
          // Count how many records (masuk/pulang) for this user on this day
          recordCount: { $sum: 1 },
          // Track if they have 'hadir' status
          hasHadir: {
            $max: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] }
          },
        },
      },
      // Step 2: Group by month/year to count unique attendances
      {
        $group: {
          _id: {
            month: '$_id.month',
            year: '$_id.year',
          },
          // Count users who have at least 2 records (masuk + pulang) with hadir status
          count: {
            $sum: { $cond: [{ $and: [{ $gte: ['$recordCount', 2] }, { $eq: ['$hasHadir', 1] }] }, 1, 0] }
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Export attendance to Excel
// @route   GET /api/dashboard/export
// @access  Private/Admin
exports.exportAttendance = async (req, res) => {
  try {
    const { rt, startDate, endDate } = req.query;

    let filter = {};

    if (rt) filter.rt = rt;

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: new Date(startDate),
        $lte: end,
      };
    }

    const attendances = await Attendance.find(filter)
      .populate('user', 'name email rt')
      .sort({ date: -1 });

    // Aggregation Logic: Group by User and Date
    const processedData = {};

    attendances.forEach((record) => {
      if (!record.user) return; // Skip if user deleted

      const dateStr = new Date(record.date).toISOString().split('T')[0];
      const key = `${record.user._id}-${dateStr}`;

      if (!processedData[key]) {
        processedData[key] = {
          date: record.date,
          user: record.user,
          rt: record.rt,
          status: record.status === 'hadir' ? 'Hadir' : 'Izin',
          checkIn: null,
          checkOut: null,
          reason: record.reason || '-',
          approved: record.approved
        };
      }

      const entry = processedData[key];

      // Update times based on type
      if (record.type === 'masuk') {
        entry.checkIn = record.createdAt;
        if (record.approved) entry.approved = true;
      } else if (record.type === 'pulang') {
        entry.checkOut = record.createdAt;
        if (record.approved) entry.approved = true;
      } else if (record.type === 'izin') {
        entry.status = 'Izin';
        entry.checkIn = record.createdAt; // Use as timestamp reference
      }
    });

    const finalData = Object.values(processedData).sort((a, b) => new Date(b.date) - new Date(a.date));

    const excelBuffer = await exportAttendanceToExcel(finalData, rt);

    const filename = `Rekap_Absensi${rt ? `_RT${rt}` : ''}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Export attendance to PDF
// @route   GET /api/dashboard/export-pdf
// @access  Private/Admin
exports.exportAttendancePDF = async (req, res) => {
  try {
    const { rt, startDate, endDate } = req.query;

    let filter = {};

    if (rt) filter.rt = rt;

    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: new Date(startDate),
        $lte: end,
      };
    }

    const attendances = await Attendance.find(filter)
      .populate('user', 'name email rt')
      .sort({ date: -1 });

    // Aggregation Logic: Group by User and Date
    const processedData = {};

    attendances.forEach((record) => {
      if (!record.user) return; // Skip if user deleted

      const dateStr = new Date(record.date).toISOString().split('T')[0];
      const key = `${record.user._id}-${dateStr}`;

      if (!processedData[key]) {
        processedData[key] = {
          date: record.date,
          user: record.user,
          rt: record.rt,
          status: record.status === 'hadir' ? 'Hadir' : 'Izin',
          checkIn: null,
          checkOut: null,
          reason: record.reason || '-',
          approved: record.approved
        };
      }

      const entry = processedData[key];

      // Update times based on type
      if (record.type === 'masuk') {
        entry.checkIn = record.createdAt;
        if (record.approved) entry.approved = true;
      } else if (record.type === 'pulang') {
        entry.checkOut = record.createdAt;
        if (record.approved) entry.approved = true;
      } else if (record.type === 'izin') {
        entry.status = 'Izin';
        entry.checkIn = record.createdAt;
      }
    });

    const finalData = Object.values(processedData).sort((a, b) => new Date(b.date) - new Date(a.date));

    const pdfBuffer = await exportAttendanceToPDF(finalData, rt);

    const filename = `Rekap_Absensi${rt ? `_RT${rt}` : ''}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user-specific statistics
// @route   GET /api/dashboard/user-stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current date for monthly stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Total attendance count for this user
    const totalAttendance = await Attendance.countDocuments({
      user: userId,
      status: 'hadir',
    });

    // Monthly attendance (current month)
    const monthlyAttendance = await Attendance.countDocuments({
      user: userId,
      status: 'hadir',
      date: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      },
    });

    // Total absent count
    const totalAbsent = await Attendance.countDocuments({
      user: userId,
      status: 'tidak_hadir',
    });

    // Calculate attendance rate
    const totalRecords = totalAttendance + totalAbsent;
    const attendanceRate = totalRecords > 0
      ? ((totalAttendance / totalRecords) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalAttendance,
        monthlyAttendance,
        totalAbsent,
        attendanceRate: parseFloat(attendanceRate),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get report preview/summary
// @route   GET /api/dashboard/report-preview
// @access  Private/Admin
exports.getReportPreview = async (req, res) => {
  try {
    const { rt, startDate, endDate } = req.query;

    let filter = {};

    if (rt) filter.rt = rt;

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Total records that will be exported
    const totalRecords = await Attendance.countDocuments(filter);

    // Attendance summary (hadir vs tidak hadir)
    const attendanceSummary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const hadir = attendanceSummary.find((item) => item._id === 'hadir')?.count || 0;
    const tidakHadir = attendanceSummary.find((item) => item._id === 'tidak_hadir')?.count || 0;
    const attendanceRate = totalRecords > 0 ? ((hadir / totalRecords) * 100).toFixed(1) : 0;

    // Top RT Performance (only if not filtering by specific RT)
    let topRT = [];
    if (!rt) {
      const rtPerformance = await Attendance.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$rt',
            total: { $sum: 1 },
            hadir: {
              $sum: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            rt: '$_id',
            total: 1,
            hadir: 1,
            rate: {
              $multiply: [
                { $divide: ['$hadir', '$total'] },
                100,
              ],
            },
          },
        },
        { $sort: { rate: -1 } },
        { $limit: 5 },
      ]);

      topRT = rtPerformance.map((item) => ({
        rt: item.rt,
        total: item.total,
        hadir: item.hadir,
        rate: item.rate.toFixed(1),
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        attendanceSummary: {
          hadir,
          tidakHadir,
          rate: attendanceRate,
        },
        topRT,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's personal weekly stats
// @route   GET /api/dashboard/user-weekly-stats
// @access  Private
exports.getUserWeeklyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get last 4 weeks data
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyData = await Attendance.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          date: { $gte: fourWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$date' },
            year: { $year: '$date' },
          },
          hadir: {
            $sum: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] },
          },
          tidak_hadir: {
            $sum: { $cond: [{ $eq: ['$status', 'tidak_hadir'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    console.log('User Weekly Stats:', { userId, dataCount: weeklyData.length });

    res.status(200).json({
      success: true,
      data: weeklyData,
    });
  } catch (error) {
    console.error('Error in getUserWeeklyStats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's personal monthly stats
// @route   GET /api/dashboard/user-monthly-stats
// @access  Private
exports.getUserMonthlyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    // SCENARIO 1: Web Chart Request (No 'year' param provided)
    // Return breakdown by month for the last 6 months (Pivoted Data)
    if (year === undefined) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = await Attendance.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              year: { $year: '$date' },
            },
            hadir: {
              $sum: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] },
            },
            tidak_hadir: {
              $sum: { $cond: [{ $eq: ['$status', 'tidak_hadir'] }, 1, 0] },
            },
            izin: { // Adding izin for completeness, mapped to tidak_hadir or separate if needed
              $sum: { $cond: [{ $eq: ['$status', 'izin'] }, 1, 0] },
            },
            total: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      return res.status(200).json({
        success: true,
        data: monthlyData,
      });
    }

    // SCENARIO 2: Mobile App Summary Request ('year' param is provided)
    const matchStage = {
      user: new mongoose.Types.ObjectId(userId),
    };

    const yearNum = year && year !== 'semua' ? parseInt(year, 10) : null;
    const monthNum = month && month !== 'semua' ? parseInt(month, 10) : null;

    if (yearNum) {
      if (monthNum) {
        const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
        const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
        matchStage.date = { $gte: startDate, $lte: endDate };
      } else {
        const startDate = new Date(Date.UTC(yearNum, 0, 1));
        const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999));
        matchStage.date = { $gte: startDate, $lte: endDate };
      }
    }

    const result = await Attendance.aggregate([
      // 1. Filter documents by user and date range
      { $match: matchStage },
      // 2. Group by date to check entries per day
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
          },
          // Count entries that are 'hadir' (masuk/pulang)
          hadir_count: {
            $sum: { $cond: [{ $eq: ['$status', 'hadir'] }, 1, 0] }
          },
          // Check if there is any 'izin' entry for that day
          izin_flag: {
            $max: { $cond: [{ $eq: ['$status', 'izin'] }, 1, 0] }
          }
        }
      },
      // 3. Group everything to get the final totals
      {
        $group: {
          _id: null,
          // Sum up days where 'hadir_count' is 2 or more (masuk and pulang)
          hadir: {
            $sum: { $cond: [{ $and: [{ $gte: ['$hadir_count', 2] }, { $eq: ['$izin_flag', 0] }] }, 1, 0] }
          },
          // Sum up days where 'izin_flag' is 1
          izin: {
            $sum: '$izin_flag'
          }
        }
      }
    ]);

    // If result is empty, return a zeroed object
    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        data: [{ hadir: 0, izin: 0 }],
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Error in getUserMonthlyStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching NEW monthly stats: ' + error.message,
    });
  }
};
