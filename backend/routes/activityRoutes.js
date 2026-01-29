const express = require('express');
const router = express.Router();
const {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadDocumentation,
} = require('../controllers/activityController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes (require authentication)
router.get('/', protect, getAllActivities);
router.get('/:id', protect, getActivityById);

// Admin only routes
router.post('/', protect, admin, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documentation', maxCount: 10 }]), createActivity);
router.put('/:id', protect, admin, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'documentation', maxCount: 10 }]), updateActivity);
router.post('/:id/documentation', protect, admin, upload.fields([{ name: 'documentation', maxCount: 10 }]), uploadDocumentation);
router.delete('/:id', protect, admin, deleteActivity);

module.exports = router;
