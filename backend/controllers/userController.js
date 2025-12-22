const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');
const { createNotification, NotificationTemplates } = require('../utils/notificationHelper');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { rt, role, status, search } = req.query;

    let filter = {};

    if (rt) filter.rt = rt;
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    // Update fields
    const { name, phone, rt, photo } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.rt = rt || user.rt;
    user.photo = photo || user.photo;

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Ban/Unban user
// @route   PUT /api/users/:id/ban
// @access  Private/Admin
exports.toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    const newStatus = user.status === 'active' ? 'banned' : 'active';
    user.status = newStatus;
    await user.save();

    // Send notification to user
    const notifTemplate = newStatus === 'banned'
      ? NotificationTemplates.userBanned()
      : NotificationTemplates.userUnbanned();

    await createNotification(
      user._id,
      notifTemplate.type,
      notifTemplate.title,
      notifTemplate.message,
      notifTemplate.link,
      { userId: user._id, status: newStatus }
    );

    res.status(200).json({
      success: true,
      message: `User berhasil ${newStatus === 'banned' ? 'diblokir' : 'diaktifkan'}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get users by RT
// @route   GET /api/users/rt/:rtNumber
// @access  Private
exports.getUsersByRT = async (req, res) => {
  try {
    const users = await User.find({
      rt: req.params.rtNumber,
      role: 'user'
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
