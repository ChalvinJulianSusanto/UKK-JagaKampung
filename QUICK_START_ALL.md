# 🚀 Quick Start - JagaKampung Full Stack

Panduan cepat untuk menjalankan semua komponen JagaKampung.

## 📦 Komponen Sistem

1. **Backend API** (Node.js + Express + MongoDB)
2. **Frontend Web** (Admin Dashboard - React)
3. **Frontend Mobile** (User App - React)

## 🔧 Prerequisites

- Node.js v18+ dan npm
- MongoDB (local atau Atlas)
- Browser modern (Chrome/Firefox)

## 📝 Setup Pertama Kali

### 1. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies (jika belum)
npm install

# Copy .env.example ke .env
cp .env.example .env

# Edit .env sesuai kebutuhan
# MONGODB_URI=mongodb://localhost:27017/jagakampung
# JWT_SECRET=jagakampung_secret_key_2025_super_secure
```

### 2. Setup Frontend Web (Admin)

```bash
# Masuk ke folder frontend-web
cd frontend-web

# Install dependencies (jika belum)
npm install

# Copy .env.example ke .env
cp .env.example .env

# Pastikan VITE_API_URL=http://localhost:5000/api
```

### 3. Setup Frontend Mobile (User)

```bash
# Masuk ke folder frontend-mobile
cd frontend-mobile

# Install dependencies (sudah dilakukan)
npm install

# File .env sudah ada
# VITE_API_URL=http://localhost:5000/api
```

## 🏃 Menjalankan Aplikasi

### Option A: Jalankan Satu Per Satu (3 Terminal)

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Backend running di: **http://localhost:5000**

#### Terminal 2 - Frontend Web (Admin)
```bash
cd frontend-web
npm run dev
```
✅ Admin Panel running di: **http://localhost:5173**

#### Terminal 3 - Frontend Mobile (User)
```bash
cd frontend-mobile
npm run dev
```
✅ Mobile App running di: **http://localhost:5174**

### Option B: Jalankan Semua Sekaligus (Windows)

Buat file `start-all.bat` di root folder:

```batch
@echo off
echo Starting JagaKampung Full Stack...

start cmd /k "cd backend && npm run dev"
timeout /t 3

start cmd /k "cd frontend-web && npm run dev"
timeout /t 3

start cmd /k "cd frontend-mobile && npm run dev"

echo All services started!
```

Jalankan: `start-all.bat`

## 📊 Ports yang Digunakan

```
Backend API:       http://localhost:5000
Admin Web:         http://localhost:5173
Mobile App:        http://localhost:5174
MongoDB:           mongodb://localhost:27017
```

## 👥 Test Credentials

### Admin Account (untuk Web Panel)
```
Email:    admin@jagakampung.com
Password: admin123
Role:     admin
```

### User Account (untuk Mobile App)
**Buat akun baru via Register** atau gunakan akun yang sudah dibuat.

## 🧪 Testing Flow

### 1. Setup Data Awal (via Admin Web)

1. Buka **http://localhost:5173**
2. Login sebagai admin
3. Buka menu "Schedules"
4. Upload jadwal untuk RT 01, Bulan 1, Tahun 2025
5. Upload file PDF atau gambar jadwal

### 2. Test Mobile App (User)

1. Buka **http://localhost:5174**
2. Klik "Daftar sekarang"
3. Register dengan:
   - Nama: Test User
   - Email: user@test.com
   - Phone: 081234567890
   - RT: 01
   - Password: password123
4. Login dengan akun tersebut
5. Di Dashboard, klik "Absen Ronda"
6. Ambil foto, dapatkan lokasi, submit
7. Lihat riwayat kehadiran
8. Check analytics & grafik

### 3. Approve Absensi (via Admin Web)

1. Kembali ke Admin Web (**http://localhost:5173**)
2. Buka menu "Attendances"
3. Lihat absensi yang baru disubmit
4. Klik tombol approve
5. Kembali ke Mobile App, refresh halaman riwayat
6. Status berubah menjadi "Disetujui" ✅

## 🗂️ Struktur Folder

```
JagaKampung/
├── backend/                    # Backend API
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── server.js
│
├── frontend-web/               # Admin Dashboard
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
│
├── frontend-mobile/            # User Mobile App
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
│
└── README.md
```

## 🔧 Troubleshooting

### Backend tidak connect ke MongoDB

```bash
# Pastikan MongoDB running
# Windows: Services -> MongoDB -> Start
# Mac/Linux: sudo systemctl start mongod

# Atau gunakan MongoDB Atlas (cloud)
# Update MONGODB_URI di backend/.env
```

### Port sudah digunakan

```bash
# Cek port yang digunakan
# Windows:
netstat -ano | findstr :5000
netstat -ano | findstr :5173
netstat -ano | findstr :5174

# Kill process jika perlu
# Windows:
taskkill /PID [PID_NUMBER] /F
```

### CORS Error

```bash
# Pastikan backend CORS sudah dikonfigurasi untuk:
# - http://localhost:5173 (admin web)
# - http://localhost:5174 (mobile app)

# Check di backend/server.js
```

### Camera/GPS tidak works

```bash
# Camera & GPS hanya works di:
# 1. localhost (development)
# 2. HTTPS (production)

# Pastikan browser allow permissions
```

## 📱 Deploy ke Production

### Backend (Railway/Render/Heroku)
```bash
cd backend
# Setup production database (MongoDB Atlas)
# Update environment variables
# Deploy
```

### Frontend Web (Vercel/Netlify)
```bash
cd frontend-web
npm run build
# Upload dist/ folder
# Set VITE_API_URL to production backend
```

### Frontend Mobile (Vercel/Netlify)
```bash
cd frontend-mobile
npm run build
# Upload dist/ folder
# Set VITE_API_URL to production backend
```

## 📚 Dokumentasi Lengkap

- Backend: `backend/README.md`
- Frontend Web: `frontend-web/README.md`
- Frontend Mobile: `frontend-mobile/README.md`
- Mobile App Complete: `MOBILE_APP_COMPLETE.md`
- Project Status: `PROJECT_STATUS.md`

## 🎯 Feature Comparison

| Feature | Admin Web | Mobile App |
|---------|-----------|------------|
| **Dashboard** | ✅ All RTs stats | ✅ Personal stats |
| **Users Management** | ✅ CRUD users | ❌ - |
| **Schedules** | ✅ Upload schedules | ✅ View schedules |
| **Attendances** | ✅ View all, Approve | ✅ Create, View own |
| **Analytics** | ✅ All RTs analytics | ✅ Personal analytics |
| **Reports** | ✅ Export Excel/PDF | ❌ - |
| **Profile** | ✅ Edit profile | ✅ Edit profile |

## 🎊 Summary

Sekarang Anda memiliki:

1. ✅ **Backend API** - Full CRUD, Auth, File Upload
2. ✅ **Admin Web** - Manage users, schedules, approve attendances
3. ✅ **Mobile App** - User absensi, view jadwal, analytics

Semua terintegrasi dengan baik dan siap digunakan!

## 🆘 Need Help?

Jika ada error atau pertanyaan:
1. Check console browser (F12)
2. Check terminal backend untuk error logs
3. Check dokumentasi masing-masing komponen
4. Pastikan semua dependencies terinstall

---

**Happy Coding! 🚀**

Copyright © 2025 JagaKampung. All rights reserved.
