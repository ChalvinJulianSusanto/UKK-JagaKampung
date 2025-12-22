const express = require('express');
const router = express.Router();
const {
  createAttendance,
  getAllAttendances,
  getMyAttendanceHistory,
  approveAttendance,
  deleteAttendance,
  getAttendancesByRT,
  checkTodayAttendance,
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('photo'), createAttendance);
router.get('/', protect, admin, getAllAttendances);
router.get('/my-history', protect, getMyAttendanceHistory);
router.get('/check-today/:scheduleId', protect, checkTodayAttendance);
router.get('/rt/:rtNumber', protect, getAttendancesByRT);
router.put('/:id/approve', protect, admin, approveAttendance);
router.delete('/:id', protect, admin, deleteAttendance);

module.exports = router;
