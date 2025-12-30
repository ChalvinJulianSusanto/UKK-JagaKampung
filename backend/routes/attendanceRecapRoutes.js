const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const attendanceRecapController = require('../controllers/attendanceRecapController');

// Public/User routes
router.get('/today', protect, attendanceRecapController.getTodayRecaps);
router.get('/:id', protect, attendanceRecapController.getRecapById);
router.get('/', protect, attendanceRecapController.getAllRecaps);

// Admin only routes
router.post(
    '/',
    protect,
    admin,
    upload.single('photo'),
    attendanceRecapController.createRecap
);

router.put(
    '/:id',
    protect,
    admin,
    upload.single('photo'),
    attendanceRecapController.updateRecap
);

router.delete(
    '/:id',
    protect,
    admin,
    attendanceRecapController.deleteRecap
);

module.exports = router;
