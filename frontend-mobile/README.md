# JagaKampung Mobile - Aplikasi Absensi Ronda untuk Warga

Aplikasi mobile-friendly untuk warga RT dalam melakukan absensi ronda malam.

## Teknologi

- **React 19** - UI Framework
- **Vite** - Build Tool
- **React Router v7** - Routing
- **Tailwind CSS v3** - Styling
- **Framer Motion** - Animations
- **Axios** - HTTP Client
- **Recharts** - Charts & Analytics
- **React Hot Toast** - Notifications
- **Date-fns** - Date Formatting
- **Lucide React** - Icons

## Fitur Lengkap

### Autentikasi
- ✅ Registrasi akun baru (dengan pilihan RT dan nomor HP)
- ✅ Login dengan email & password
- ✅ Remember me functionality
- ✅ Logout

### Dashboard/Beranda
- ✅ Statistik kehadiran personal (bulan ini, total, tingkat kehadiran)
- ✅ Reminder ronda hari ini
- ✅ Quick actions (Absen & Lihat Jadwal)
- ✅ Riwayat kehadiran terbaru
- ✅ Info jadwal aktif

### Absensi Ronda
- ✅ Absensi dengan foto (menggunakan kamera)
- ✅ Timestamp otomatis
- ✅ Geolocation/lokasi GPS
- ✅ Status hadir/tidak hadir
- ✅ Alasan jika tidak hadir
- ✅ Preview foto sebelum submit

### Jadwal Ronda
- ✅ Lihat jadwal per bulan
- ✅ Filter by bulan & tahun
- ✅ Download/view jadwal (PDF/Image)
- ✅ Info detail jadwal RT

### Riwayat Kehadiran
- ✅ List semua absensi user
- ✅ Detail lengkap per absensi
- ✅ Status approval dari admin (Disetujui/Pending)
- ✅ View foto bukti kehadiran
- ✅ Info lokasi absensi
- ✅ Info waktu dan tanggal

### Analitik & Grafik
- ✅ Grafik kehadiran (Bar Chart)
- ✅ Perbandingan hadir vs tidak hadir (Pie Chart)
- ✅ Filter mingguan & bulanan
- ✅ Tingkat kehadiran (percentage)
- ✅ Summary statistik

### Profil
- ✅ View profil user
- ✅ Edit profil (nama, email, phone, RT)
- ✅ Upload/change foto profil
- ✅ Info status akun
- ✅ Logout

## Setup & Installation

### Prerequisites
- Node.js v18+ dan npm
- Backend API running di http://localhost:5000

### 1. Install Dependencies

```bash
cd frontend-mobile
npm install
```

### 2. Environment Configuration

Buat file `.env` di root folder `frontend-mobile`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=JagaKampung
VITE_APP_VERSION=1.0.0
```

### 3. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5174`

### 4. Build untuk Production

```bash
npm run build
```

Output build ada di folder `dist/`

### 5. Preview Production Build

```bash
npm run preview
```

## Struktur Folder

```
frontend-mobile/
├── src/
│   ├── api/                    # API client modules
│   │   ├── client.js          # Axios instance dengan interceptors
│   │   ├── auth.js            # Auth API calls
│   │   ├── schedules.js       # Schedules API calls
│   │   ├── attendances.js     # Attendances API calls
│   │   ├── dashboard.js       # Dashboard/stats API calls
│   │   └── index.js           # Export all APIs
│   │
│   ├── components/
│   │   ├── common/            # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Select.jsx
│   │   │   └── Textarea.jsx
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── BottomNavigation.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Container.jsx
│   │   │
│   │   └── ProtectedRoute.jsx # Route protection
│   │
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication state
│   │
│   ├── pages/                 # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Home.jsx           # Dashboard
│   │   ├── Attendance.jsx     # Absensi
│   │   ├── Schedule.jsx       # Jadwal
│   │   ├── History.jsx        # Riwayat
│   │   ├── Analytics.jsx      # Grafik
│   │   └── Profile.jsx        # Profil
│   │
│   ├── styles/
│   │   └── index.css          # Global styles + Tailwind
│   │
│   ├── App.jsx                # Main app with routing
│   └── main.jsx               # Entry point
│
├── public/                    # Static assets
├── .env                       # Environment variables
├── .env.example               # Env template
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## Color Scheme (Brand)

```css
Primary Blue:    #1976D2
Primary Light:   #42A5F5
Primary Dark:    #1565C0

Secondary Yellow: #FFC107
Success Green:   #4CAF50
Error Red:       #F44336
Warning Orange:  #FF9800
```

## API Endpoints yang Digunakan

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/month/:rt/:year/:month` - Get schedule by month

### Attendances
- `POST /api/attendances` - Create attendance (with photo)
- `GET /api/attendances/my-history` - Get user's attendance history
- `DELETE /api/attendances/:id` - Delete attendance

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/weekly-stats` - Get weekly stats
- `GET /api/dashboard/monthly-stats` - Get monthly stats

## Testing

### Test Credentials

Gunakan akun yang sudah terdaftar atau register akun baru:

**Test User:**
```
Email: warga@test.com
Password: password123
RT: 01
```

## Fitur Mobile-Friendly

- ✅ Responsive design (mobile-first approach)
- ✅ Touch-optimized UI
- ✅ Native camera access untuk foto
- ✅ Geolocation/GPS support
- ✅ Bottom navigation untuk mobile
- ✅ Swipe gestures
- ✅ PWA-ready (dapat diinstall di home screen)
- ✅ Optimized for small screens
- ✅ Fast load times dengan Vite

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Code splitting dengan React.lazy()
- Image optimization
- API response caching
- Debounced search
- Memoized components
- Tree shaking dengan Vite
- CSS minification
- Asset compression

## Troubleshooting

### Kamera tidak berfungsi
- Pastikan browser memiliki permission untuk camera access
- Gunakan HTTPS jika deploy ke production (camera API hanya works di HTTPS)

### Geolocation tidak akurat
- Aktifkan GPS di device
- Berikan permission location access ke browser
- Gunakan device yang support GPS

### API Connection Error
- Pastikan backend running di http://localhost:5000
- Check VITE_API_URL di file .env
- Check CORS configuration di backend

## Deploy ke Production

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload folder dist/ ke Netlify
```

### Manual Deploy
```bash
npm run build
# Upload folder dist/ ke hosting (Apache/Nginx)
```

Jangan lupa update `VITE_API_URL` di production!

## Kontributor

- **Frontend Mobile Developer** - Full implementation

## License

Copyright © 2025 JagaKampung. All rights reserved.
