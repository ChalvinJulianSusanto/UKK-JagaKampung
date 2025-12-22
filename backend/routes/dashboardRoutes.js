const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getWeeklyStats,
  getMonthlyStats,
  exportAttendance,
  exportAttendancePDF,
  getReportPreview,
  getUserStats,
  getUserWeeklyStats,
  getUserMonthlyStats,
} = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/auth');

// User-specific stats (no admin required)
router.get('/user-stats', protect, getUserStats);
router.get('/user-weekly-stats', protect, getUserWeeklyStats);
router.get('/user-monthly-stats', protect, getUserMonthlyStats);

// Admin-only routes
router.get('/stats', protect, admin, getDashboardStats);
router.get('/weekly-stats', protect, admin, getWeeklyStats);
router.get('/monthly-stats', protect, admin, getMonthlyStats);
router.get('/export', protect, admin, exportAttendance);
router.get('/export-pdf', protect, admin, exportAttendancePDF);
router.get('/report-preview', protect, admin, getReportPreview);

module.exports = router;
