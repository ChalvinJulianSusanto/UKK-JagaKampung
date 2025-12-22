const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - User harus login
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      // Check if user is banned
      if (req.user.status === 'banned') {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda telah diblokir. Silakan hubungi admin.',
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Tidak ada akses. Token tidak ditemukan',
    });
  }
};

// Admin only middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang dapat mengakses',
    });
  }
};

// Generate JWT Token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
