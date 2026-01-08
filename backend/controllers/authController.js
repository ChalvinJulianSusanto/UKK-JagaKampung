const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadToCloudinary');
const { uploadToLocal, deleteFromLocal } = require('../utils/uploadLocal');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, rt } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      rt,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          rt: user.rt,
          role: user.role,
          status: user.status,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah diblokir. Silakan hubungi admin.',
      });
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        rt: user.rt,
        role: user.role,
        status: user.status,
        photo: user.photo,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, rt, currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;

    // Allow users to update their RT
    if (rt) {
      user.rt = rt;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      // Verify current password
      const isPasswordMatch = await user.matchPassword(currentPassword);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;
    }

    // Handle photo removal
    if (req.body.removePhoto === true || req.body.removePhoto === 'true') {
      try {
        if (user.photo) {
          // Delete from Cloudinary if it's a Cloudinary URL
          if (user.photo.includes('cloudinary')) {
            try {
              const urlParts = user.photo.split('/');
              const publicIdWithExt = urlParts[urlParts.length - 1];
              const publicId = `jagakampung/profiles/${publicIdWithExt.split('.')[0]}`;
              await deleteFromCloudinary(publicId);
              console.log('Photo deleted from Cloudinary');
            } catch (deleteError) {
              console.log('Error deleting photo from Cloudinary:', deleteError);
            }
          }
          // Delete from local storage if it's a local path
          else if (user.photo.startsWith('/uploads')) {
            try {
              const publicId = user.photo.replace('/uploads/', '');
              await deleteFromLocal(publicId);
              console.log('Photo deleted from local storage');
            } catch (deleteError) {
              console.log('Error deleting photo from local storage:', deleteError);
            }
          }
          user.photo = null;
        }
      } catch (removeError) {
        console.error('Remove photo error:', removeError);
      }
    }

    // Handle photo upload
    if (req.file) {
      try {
        const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET;

        let result;

        if (useCloudinary) {
          // Try Cloudinary first
          try {
            console.log('Uploading photo to Cloudinary...');

            // Delete old photo if exists and is from cloudinary
            if (user.photo && user.photo.includes('cloudinary')) {
              try {
                const urlParts = user.photo.split('/');
                const publicIdWithExt = urlParts[urlParts.length - 1];
                const publicId = `jagakampung/profiles/${publicIdWithExt.split('.')[0]}`;
                await deleteFromCloudinary(publicId);
              } catch (deleteError) {
                console.log('Error deleting old photo:', deleteError);
              }
            }

            result = await uploadToCloudinary(req.file.buffer, 'jagakampung/profiles');
            console.log('Photo uploaded to Cloudinary successfully:', result.secure_url);
          } catch (cloudinaryError) {
            console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
            // Fallback to local storage
            result = await uploadToLocal(req.file.buffer, 'profiles');
            console.log('Photo uploaded to local storage:', result.secure_url);
          }
        } else {
          // Use local storage
          console.log('Using local storage for photo upload...');

          // Delete old photo if exists and is local
          if (user.photo && user.photo.startsWith('/uploads')) {
            try {
              const publicId = user.photo.replace('/uploads/', '');
              await deleteFromLocal(publicId);
            } catch (deleteError) {
              console.log('Error deleting old photo:', deleteError);
            }
          }

          result = await uploadToLocal(req.file.buffer, 'profiles');
          console.log('Photo uploaded to local storage successfully:', result.secure_url);
        }

        user.photo = result.secure_url;
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload photo: ' + uploadError.message,
        });
      }
    }

    // Save user
    await user.save();

    // Return updated user (without password)
    const updatedUser = await User.findById(user._id);

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login/Register with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email (registered with email/password)
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.authProvider = 'google';
        if (!user.photo && picture) {
          user.photo = picture;
        }
        await user.save();
      } else {
        // Create new user with Google account
        user = await User.create({
          name,
          email,
          googleId,
          authProvider: 'google',
          photo: picture || null,
          // RT will be set later by user
        });
      }
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah diblokir. Silakan hubungi admin.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        rt: user.rt,
        role: user.role,
        status: user.status,
        photo: user.photo,
        authProvider: user.authProvider,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed: ' + error.message,
    });
  }
};
