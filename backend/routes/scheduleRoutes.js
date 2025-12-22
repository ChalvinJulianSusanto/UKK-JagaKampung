const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getAllSchedules,
  getSchedule,
  getScheduleByMonth,
  deleteSchedule,
  addEntry,
  updateEntry,
  deleteEntry,
  getTodayPartner,
} = require('../controllers/scheduleController');
const { protect, admin } = require('../middleware/auth');

// Schedule container routes
router.post('/', protect, admin, createSchedule);
router.get('/', protect, getAllSchedules);
router.get('/month/:rt/:year/:month', protect, getScheduleByMonth);
router.get('/today-partner', protect, getTodayPartner);
router.get('/:id', protect, getSchedule);
router.delete('/:id', protect, admin, deleteSchedule);

// Entry management routes
router.post('/:id/entries', protect, admin, addEntry);
router.put('/:id/entries/:entryId', protect, admin, updateEntry);
router.delete('/:id/entries/:entryId', protect, admin, deleteEntry);

module.exports = router;