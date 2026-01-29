const express = require('express');
const router = express.Router();
const {
    getAllBudgets,
    getBudgetSummary,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
} = require('../controllers/budgetController');
const { protect, admin } = require('../middleware/auth');

// Summary route (must come before /:id route)
router.get('/summary', protect, getBudgetSummary);

// Public routes (require authentication)
router.get('/', protect, getAllBudgets);
router.get('/:id', protect, getBudgetById);

// Admin only routes
router.post('/', protect, admin, createBudget);
router.put('/:id', protect, admin, updateBudget);
router.delete('/:id', protect, admin, deleteBudget);

module.exports = router;
