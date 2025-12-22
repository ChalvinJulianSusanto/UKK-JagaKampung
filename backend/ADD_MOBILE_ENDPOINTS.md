# Cara Menambahkan Endpoint untuk Mobile App

Ikuti langkah-langkah ini untuk menambahkan endpoint yang diperlukan mobile app.

---

## 1️⃣ Update CORS Configuration

**File:** `server.js` (line 21-37)

**GANTI:**
```javascript
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all localhost origins in development
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // For production, you can add specific domains here
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
```

**DENGAN:**
```javascript
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all localhost origins in development
      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      // Allow local network IPs for mobile development
      if (origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.0.') ||
          origin.startsWith('http://172.')) {
        return callback(null, true);
      }

      // For production, you can add specific domains here
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
```

---

## 2️⃣ Tambahkan Method di Schedule Controller

**File:** `controllers/scheduleController.js`

**TAMBAHKAN di akhir file (sebelum module.exports):**

```javascript
// @desc    Get user's schedules
// @route   GET /api/schedules/my-schedules
// @access  Private
exports.getMySchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({
      user: req.user.id
    })
    .populate('user', 'name email rt')
    .sort({ date: -1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching schedules',
      error: error.message,
    });
  }
};

// @desc    Get today's schedule for current user
// @route   GET /api/schedules/today
// @access  Private
exports.getTodaySchedule = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedule = await Schedule.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('user', 'name email rt photo')
    .populate('attendance');

    res.json({
      success: true,
      schedule: schedule || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today schedule',
      error: error.message,
    });
  }
};
```

---

## 3️⃣ Update Schedule Routes

**File:** `routes/scheduleRoutes.js`

**UPDATE bagian require:**
```javascript
const {
  createSchedule,
  getAllSchedules,
  getSchedule,
  getScheduleByMonth,
  updateSchedule,
  deleteSchedule,
  getMySchedules,        // ← TAMBAHKAN
  getTodaySchedule,      // ← TAMBAHKAN
} = require('../controllers/scheduleController');
```

**TAMBAHKAN routes (setelah line 15):**
```javascript
router.get('/my-schedules', protect, getMySchedules);
router.get('/today', protect, getTodaySchedule);
```

**URUTAN PENTING:**
```javascript
// Specific routes HARUS di atas dynamic routes
router.post('/', protect, admin, uploadSchedule.single('scheduleFile'), createSchedule);
router.get('/', protect, getAllSchedules);
router.get('/my-schedules', protect, getMySchedules);        // ← Sebelum /:id
router.get('/today', protect, getTodaySchedule);            // ← Sebelum /:id
router.get('/month/:rt/:year/:month', protect, getScheduleByMonth);
router.get('/:id', protect, getSchedule);                   // ← Dynamic route
router.put('/:id', protect, admin, uploadSchedule.single('scheduleFile'), updateSchedule);
router.delete('/:id', protect, admin, deleteSchedule);
```

---

## 4️⃣ Tambahkan Method di Attendance Controller

**File:** `controllers/attendanceController.js`

**TAMBAHKAN di akhir file:**

```javascript
// @desc    Get attendance statistics for current user
// @route   GET /api/attendances/stats
// @access  Private
exports.getAttendanceStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendances = await Attendance.find({
      user: req.user.id,
      createdAt: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      },
    });

    const stats = {
      thisMonth: {
        hadir: attendances.filter(a => a.status === 'hadir').length,
        tidakHadir: attendances.filter(a => a.status === 'tidak hadir').length,
        total: attendances.length,
      },
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message,
    });
  }
};

// @desc    Submit attendance for a schedule
// @route   POST /api/attendances/:scheduleId/submit
// @access  Private
exports.submitAttendance = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status, reason } = req.body;

    // Check if schedule exists
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Check if user already submitted attendance for this schedule
    const existingAttendance = await Attendance.findOne({
      schedule: scheduleId,
      user: req.user.id,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah melakukan absensi untuk jadwal ini',
      });
    }

    // Create attendance data
    const attendanceData = {
      schedule: scheduleId,
      user: req.user.id,
      status: status || 'hadir',
      date: new Date(),
    };

    // Add reason if status is tidak hadir
    if (status === 'tidak hadir' && reason) {
      attendanceData.reason = reason;
    }

    // Add photo if uploaded (for hadir status)
    if (req.file && status === 'hadir') {
      attendanceData.photo = `/uploads/${req.file.filename}`;
    }

    const attendance = await Attendance.create(attendanceData);

    // Update schedule with attendance reference
    await Schedule.findByIdAndUpdate(scheduleId, {
      attendance: attendance._id,
    });

    res.status(201).json({
      success: true,
      message: 'Absensi berhasil dicatat',
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting attendance',
      error: error.message,
    });
  }
};
```

---

## 5️⃣ Update Attendance Routes

**File:** `routes/attendanceRoutes.js`

**UPDATE bagian require:**
```javascript
const {
  createAttendance,
  getAllAttendances,
  getMyAttendances,
  approveAttendance,
  deleteAttendance,
  getAttendancesByRT,
  getAttendanceStats,      // ← TAMBAHKAN
  submitAttendance,        // ← TAMBAHKAN
} = require('../controllers/attendanceController');
```

**TAMBAHKAN routes:**
```javascript
router.post('/', protect, upload.single('photo'), createAttendance);
router.get('/', protect, admin, getAllAttendances);
router.get('/my-history', protect, getMyAttendances);
router.get('/my-attendances', protect, getMyAttendances);  // ← TAMBAHKAN (Alias)
router.get('/stats', protect, getAttendanceStats);         // ← TAMBAHKAN
router.get('/rt/:rtNumber', protect, getAttendancesByRT);
router.post('/:scheduleId/submit', protect, upload.single('proofPhoto'), submitAttendance);  // ← TAMBAHKAN
router.put('/:id/approve', protect, admin, approveAttendance);
router.delete('/:id', protect, admin, deleteAttendance);
```

---

## 6️⃣ Tambahkan Method di Auth Controller

**File:** `controllers/authController.js`

**TAMBAHKAN di akhir file:**

```javascript
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password dan new password harus diisi',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini salah',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
};
```

---

## 7️⃣ Update Auth Routes

**File:** `routes/authRoutes.js`

**UPDATE bagian require:**
```javascript
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword       // ← TAMBAHKAN
} = require('../controllers/authController');
```

**TAMBAHKAN route:**
```javascript
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.put('/profile', protect, upload.single('photo'), updateProfile);
router.put('/change-password', protect, changePassword);  // ← TAMBAHKAN
```

---

## 8️⃣ (Optional) Tambahkan Upload Profile Photo di User Controller

**File:** `controllers/userController.js`

**TAMBAHKAN di akhir file:**

```javascript
// @desc    Upload profile photo
// @route   POST /api/users/profile-photo
// @access  Private
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    // Update photo URL
    user.photo = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Foto profil berhasil diupload',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        rt: user.rt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading photo',
      error: error.message,
    });
  }
};
```

**Update User Routes:**

**File:** `routes/userRoutes.js`

```javascript
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleBanUser,
  getUsersByRT,
  uploadProfilePhoto,    // ← TAMBAHKAN
} = require('../controllers/userController');

const upload = require('../middleware/upload');  // ← TAMBAHKAN

router.get('/', protect, admin, getAllUsers);
router.get('/rt/:rtNumber', protect, getUsersByRT);
router.post('/profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);  // ← TAMBAHKAN
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, admin, deleteUser);
router.put('/:id/ban', protect, admin, toggleBanUser);
```

---

## ✅ Testing Endpoints

Setelah semua perubahan di atas, restart backend dan test:

```bash
# Restart backend
npm run dev
```

### Test dengan Postman atau cURL:

1. **Login:**
```bash
POST http://localhost:5000/api/auth/login
Body: { "email": "user@test.com", "password": "123456" }
```

2. **Get Today Schedule:**
```bash
GET http://localhost:5000/api/schedules/today
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

3. **Get Stats:**
```bash
GET http://localhost:5000/api/attendances/stats
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
```

4. **Submit Attendance:**
```bash
POST http://localhost:5000/api/attendances/SCHEDULE_ID/submit
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body (multipart): { "status": "hadir", "proofPhoto": FILE }
```

5. **Change Password:**
```bash
PUT http://localhost:5000/api/auth/change-password
Headers: { "Authorization": "Bearer YOUR_TOKEN" }
Body: { "currentPassword": "old", "newPassword": "new123" }
```

---

## 🎯 Summary

Total endpoint yang ditambahkan:
1. ✅ `GET /api/schedules/my-schedules`
2. ✅ `GET /api/schedules/today`
3. ✅ `GET /api/attendances/my-attendances` (alias)
4. ✅ `GET /api/attendances/stats`
5. ✅ `POST /api/attendances/:scheduleId/submit`
6. ✅ `PUT /api/auth/change-password`
7. ✅ `POST /api/users/profile-photo` (optional)

**Selesai!** Backend sekarang compatible dengan mobile app.
