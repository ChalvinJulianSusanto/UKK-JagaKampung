const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/income - Get all income records
router.get('/', incomeController.getAllIncome);

// GET /api/income/summary - Get income summary
router.get('/summary', incomeController.getIncomeSummary);

// POST /api/income - Create new income (admin only)
router.post('/', admin, incomeController.createIncome);

// PUT /api/income/:id - Update income (admin only)
router.put('/:id', admin, incomeController.updateIncome);

// DELETE /api/income/:id - Delete income (admin only)
router.delete('/:id', admin, incomeController.deleteIncome);

module.exports = router;
