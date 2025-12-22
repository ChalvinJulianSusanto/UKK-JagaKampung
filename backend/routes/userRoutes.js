const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleBanUser,
  getUsersByRT,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAllUsers);
router.get('/rt/:rtNumber', protect, getUsersByRT);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, admin, deleteUser);
router.put('/:id/ban', protect, admin, toggleBanUser);

module.exports = router;
