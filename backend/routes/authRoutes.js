const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin); // Google OAuth login
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe); // Add GET endpoint for profile
router.put('/profile', protect, upload.single('photo'), updateProfile);

module.exports = router;
