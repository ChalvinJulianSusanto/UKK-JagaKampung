# Backend Analysis untuk Mobile App

## 📊 Status: Perlu Beberapa Penambahan Endpoint

---

## ✅ Endpoint yang SUDAH ADA (Bisa Dipakai Langsung)

### Authentication Routes (`/api/auth`)
- ✅ `POST /api/auth/register` - Register user baru
- ✅ `POST /api/auth/login` - Login user
- ✅ `GET /api/auth/me` - Get current user data
- ✅ `GET /api/auth/profile` - Get profile (sama dengan /me)
- ✅ `PUT /api/auth/profile` - Update profile dengan foto

### User Routes (`/api/users`)
- ✅ `GET /api/users` - Get all users (admin)
- ✅ `GET /api/users/rt/:rtNumber` - Get users by RT
- ✅ `GET /api/users/:id` - Get user by ID
- ✅ `PUT /api/users/:id` - Update user
- ✅ `DELETE /api/users/:id` - Delete user (admin)
- ✅ `PUT /api/users/:id/ban` - Toggle ban user (admin)

### Schedule Routes (`/api/schedules`)
- ✅ `POST /api/schedules` - Create schedule (admin)
- ✅ `GET /api/schedules` - Get all schedules
- ✅ `GET /api/schedules/month/:rt/:year/:month` - Get schedule by month
- ✅ `GET /api/schedules/:id` - Get schedule by ID
- ✅ `PUT /api/schedules/:id` - Update schedule (admin)
- ✅ `DELETE /api/schedules/:id` - Delete schedule (admin)

### Attendance Routes (`/api/attendances`)
- ✅ `POST /api/attendances` - Create attendance
- ✅ `GET /api/attendances` - Get all attendances (admin)
- ✅ `GET /api/attendances/my-history` - Get my attendances ⚠️ (Perlu diganti ke /my-attendances)
- ✅ `GET /api/attendances/rt/:rtNumber` - Get attendances by RT
- ✅ `PUT /api/attendances/:id/approve` - Approve attendance (admin)
- ✅ `DELETE /api/attendances/:id` - Delete attendance (admin)

---

## ❌ Endpoint yang BELUM ADA (Perlu Ditambahkan)

### 1. Today's Schedule
```javascript
GET /api/schedules/today
```
**Diperlukan untuk:** Home screen - menampilkan jadwal hari ini

### 2. My Schedules
```javascript
GET /api/schedules/my-schedules
```
**Diperlukan untuk:** Schedule screen - filter jadwal user

### 3. Attendance Stats
```javascript
GET /api/attendances/stats
```
**Diperlukan untuk:** Home screen - statistik bulanan

### 4. Submit Attendance (dengan schedule ID)
```javascript
POST /api/attendances/:scheduleId/submit
```
**Diperlukan untuk:** Attendance screen - submit dengan schedule reference

### 5. Change Password
```javascript
PUT /api/auth/change-password
```
**Diperlukan untuk:** Profile screen - ubah password

### 6. Upload Profile Photo (terpisah)
```javascript
POST /api/users/profile-photo
```
**Diperlukan untuk:** Profile screen - upload foto profil terpisah

---

## ⚠️ Perbedaan Kecil yang Perlu Disesuaikan

### 1. Endpoint Path
**Backend sekarang:**
```
GET /api/attendances/my-history
```

**Mobile app mengharapkan:**
```
GET /api/attendances/my-attendances
```

**Solusi:** Tambahkan alias route atau ubah mobile app

### 2. CORS Configuration
**Backend sekarang:** Hanya allow localhost
```javascript
if (origin.startsWith('http://localhost:')) {
  return callback(null, true);
}
```

**Mobile app butuh:** Allow semua origin (development) atau IP specific
```javascript
// Perlu ditambahkan
if (origin.startsWith('http://192.168.')) {
  return callback(null, true);
}
```

---

## 🔧 File yang Perlu Dimodifikasi

### 1. `routes/scheduleRoutes.js`
Tambahkan:
```javascript
router.get('/today', protect, getTodaySchedule);
router.get('/my-schedules', protect, getMySchedules);
```

### 2. `routes/attendanceRoutes.js`
Tambahkan:
```javascript
router.get('/my-attendances', protect, getMyAttendances); // Alias
router.get('/stats', protect, getAttendanceStats);
router.post('/:scheduleId/submit', protect, upload.single('proofPhoto'), submitAttendance);
```

### 3. `routes/authRoutes.js`
Tambahkan:
```javascript
router.put('/change-password', protect, changePassword);
```

### 4. `routes/userRoutes.js`
Tambahkan:
```javascript
router.post('/profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);
```

### 5. `server.js`
Update CORS:
```javascript
cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Allow localhost
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow local network IPs for mobile development
    if (origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.0.') ||
        origin.startsWith('http://172.')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
})
```

---

## 📝 Penjelasan `npm run dev` vs `npm start`

### Backend (Node.js):

**package.json backend:**
```json
{
  "scripts": {
    "start": "node server.js",      // Production mode
    "dev": "nodemon server.js"      // Development mode (auto-restart)
  }
}
```

- **`npm start`** → Jalankan dengan `node` (production, tidak auto-restart)
- **`npm run dev`** → Jalankan dengan `nodemon` (development, auto-restart saat file berubah)

**Untuk development, GUNAKAN:**
```bash
npm run dev
```

### Mobile App (React Native):

**package.json mobile:**
```json
{
  "scripts": {
    "start": "expo start"           // Development server
  }
}
```

- **`npm start`** → Jalankan Expo development server

**KEDUANYA BISA JALAN BERSAMAAN:**
- Backend: `npm run dev` di port 5000
- Mobile: `npm start` di port 19000/19001

**TIDAK BENTROK** karena pakai port berbeda!

---

## 🚀 Cara Jalankan Backend untuk Mobile

### Opsi 1: Development Mode (Recommended)
```bash
cd C:\Users\user\Desktop\JagaKampung\backend
npm run dev
```

**Keuntungan:**
- Auto-restart saat code berubah
- Cocok untuk development

### Opsi 2: Production Mode
```bash
cd C:\Users\user\Desktop\JagaKampung\backend
npm start
```

**Keuntungan:**
- Lebih stabil
- Cocok untuk production

---

## 🔍 Yang Perlu Dilakukan Sekarang

### Prioritas TINGGI (Wajib):
1. ✅ **Update CORS** - Allow mobile IP addresses
2. ✅ **Tambah endpoint** `/api/schedules/today`
3. ✅ **Tambah endpoint** `/api/attendances/stats`
4. ✅ **Tambah endpoint** `/api/auth/change-password`

### Prioritas SEDANG (Opsional tapi Recommended):
5. ⚠️ **Tambah endpoint** `/api/schedules/my-schedules`
6. ⚠️ **Tambah endpoint** `/api/attendances/:scheduleId/submit`
7. ⚠️ **Tambah alias** `/api/attendances/my-attendances`

### Prioritas RENDAH (Nice to have):
8. 📝 **Tambah endpoint** `/api/users/profile-photo`

---

## 💡 Alternatif Solusi

### Jika TIDAK ingin ubah backend:

Ubah mobile app untuk menggunakan endpoint yang ada:

```javascript
// Di mobile-app/src/services/api.js

// Ganti:
getMyAttendances: async (params = {}) => {
  const response = await api.get('/attendances/my-attendances', { params });
  return response.data;
},

// Menjadi:
getMyAttendances: async (params = {}) => {
  const response = await api.get('/attendances/my-history', { params });
  return response.data;
},
```

**TAPI** lebih baik tambahkan endpoint yang missing di backend untuk konsistensi.

---

## ✅ Kesimpulan

### Backend Web vs Backend Mobile:

**JAWABAN:** Backend **SAMA**, tapi perlu **PENAMBAHAN ENDPOINT** untuk mobile.

### Status Compatibility:

| Fitur Mobile | Endpoint | Status | Action |
|-------------|----------|---------|--------|
| Login | `POST /api/auth/login` | ✅ Ready | - |
| Register | `POST /api/auth/register` | ✅ Ready | - |
| Get Profile | `GET /api/auth/me` | ✅ Ready | - |
| Update Profile | `PUT /api/auth/profile` | ✅ Ready | - |
| Change Password | `PUT /api/auth/change-password` | ❌ Missing | Tambah |
| Today Schedule | `GET /api/schedules/today` | ❌ Missing | Tambah |
| All Schedules | `GET /api/schedules` | ✅ Ready | - |
| My Attendances | `GET /api/attendances/my-history` | ⚠️ Different | Alias |
| Submit Attendance | `POST /api/attendances` | ⚠️ Different | Adjust |
| Attendance Stats | `GET /api/attendances/stats` | ❌ Missing | Tambah |

### Rekomendasi:

**GUNAKAN BACKEND YANG SAMA**, tapi:
1. ✅ Update CORS configuration
2. ✅ Tambahkan 3-4 endpoint baru
3. ✅ Buat alias untuk endpoint yang beda nama

**Estimasi waktu:** 30-60 menit untuk menambahkan semua endpoint yang missing.

---

**Next Step:**
Saya bisa buatkan file lengkap untuk menambahkan endpoint yang missing?
