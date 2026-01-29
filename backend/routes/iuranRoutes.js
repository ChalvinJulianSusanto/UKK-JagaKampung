const express = require('express');
const router = express.Router();
const {
    getAllIuran,
    getIuranSummary,
    getIuranById,
    createIuran,
    updateIuran,
    deleteIuran,
} = require('../controllers/iuranController');
const { protect, admin } = require('../middleware/auth');

// Summary route (must come before /:id route)
router.get('/summary', protect, getIuranSummary);

// Public routes (require authentication)
router.get('/', protect, getAllIuran);
router.get('/:id', protect, getIuranById);

// Admin only routes
router.post('/', protect, admin, createIuran);
router.put('/:id', protect, admin, updateIuran);
router.delete('/:id', protect, admin, deleteIuran);

module.exports = router;
