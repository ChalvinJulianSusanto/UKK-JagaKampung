# JagaKampung - Development Guide

## 🎯 Quick Start

### Backend (API)
```bash
cd backend
npm run dev
# Server: http://localhost:5000
```

### Frontend Web (Admin)
```bash
cd frontend-web
npm run dev
# App: http://localhost:5173
```

### Frontend Mobile (User)
```bash
cd frontend-mobile
npm start
npm run android # or npm run ios
```

## 📋 Implementation Checklist

### ✅ Backend - COMPLETED
- [x] Database models (User, Schedule, Attendance, RT)
- [x] Authentication & JWT
- [x] CRUD APIs
- [x] File upload (Cloudinary)
- [x] Excel export
- [x] Dashboard statistics
- [x] Error handling

### 🔄 Frontend Web - IN PROGRESS
Files to create:

#### 1. API Client
```
src/api/client.js - Axios instance with interceptors
src/api/auth.js - Auth API calls
src/api/users.js - Users API calls
src/api/schedules.js - Schedules API calls
src/api/attendances.js - Attendances API calls
src/api/dashboard.js - Dashboard API calls
```

#### 2. Context & State
```
src/context/AuthContext.jsx - Auth state management
src/context/AppContext.jsx - Global app state
```

#### 3. Components - Common
```
src/components/common/Button.jsx
src/components/common/Input.jsx
src/components/common/Card.jsx
src/components/common/Modal.jsx
src/components/common/Table.jsx
src/components/common/Loading.jsx
src/components/common/Badge.jsx
```

#### 4. Components - Layout
```
src/components/layout/Sidebar.jsx
src/components/layout/Header.jsx
src/components/layout/MainLayout.jsx
```

#### 5. Pages
```
src/pages/Login.jsx
src/pages/Dashboard.jsx
src/pages/Users.jsx
src/pages/Schedules.jsx
src/pages/Attendances.jsx
src/pages/Reports.jsx
src/pages/Analytics.jsx
```

#### 6. Main Files
```
src/App.jsx - Router setup
src/main.jsx - Entry point
```

### 📱 Frontend Mobile - TODO
Files to create:

#### 1. API
```
src/api/client.js
src/api/auth.js
src/api/attendance.js
src/api/schedule.js
```

#### 2. Context
```
src/contexts/AuthContext.js
```

#### 3. Navigation
```
src/navigation/AppNavigator.js
src/navigation/AuthNavigator.js
src/navigation/MainNavigator.js
```

#### 4. Screens
```
src/screens/SplashScreen.js
src/screens/LoginScreen.js
src/screens/RegisterScreen.js
src/screens/HomeScreen.js
src/screens/AttendanceScreen.js
src/screens/ScheduleScreen.js
src/screens/HistoryScreen.js
src/screens/ProfileScreen.js
```

#### 5. Components
```
src/components/Button.js
src/components/Input.js
src/components/Card.js
src/components/ScheduleCard.js
src/components/AttendanceCard.js
```

## 🎨 UI/UX Guidelines

### Colors (Use Tailwind Classes)
- Primary: `bg-primary`, `text-primary`
- Secondary: `bg-secondary`, `text-secondary`
- Success: `bg-success`
- Error: `bg-error`
- Warning: `bg-warning`

### Animations
- Page transitions: Use Framer Motion
- Button hover: `hover:scale-105 transition-transform`
- Card hover: `hover:shadow-lg transition-shadow`
- Loading: Skeleton loaders

### Responsiveness
- Mobile first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly (min 44px touch targets)

## 🔑 Key Features Implementation

### 1. Authentication Flow

**Web Admin:**
```jsx
Login → Verify JWT → Dashboard
Protected routes check for admin role
```

**Mobile User:**
```jsx
Splash → Login/Register → Select RT → Home
AsyncStorage for token persistence
```

### 2. RT-based System
- 6 RT (01, 02, 03, 04, 05, 06)
- User memilih RT saat register
- Jadwal dan absensi dikategorikan per RT
- Dashboard admin bisa filter per RT

### 3. Attendance System

**Hadir:**
- User upload foto bukti
- Admin approve/reject
- Location optional

**Tidak Hadir:**
- User tulis alasan
- No approval needed
- Auto-recorded

### 4. Schedule Management
- Admin create jadwal per RT
- Assign multiple users
- Calendar view
- Edit/delete capability

### 5. Dashboard & Analytics
- Total users per RT
- Attendance stats (hadir/tidak hadir)
- Weekly/monthly charts (Recharts)
- Pending approvals count
- Recent activity feed

### 6. Export Feature
- Filter by RT & date range
- Export to Excel (exceljs)
- Formatted with colors
- Download automatically

## 🛠️ Development Tips

### Backend
- Use Postman/Thunder Client untuk test API
- MongoDB Compass untuk lihat database
- Console.log di controller untuk debug

### Frontend Web
- React DevTools untuk inspect components
- Network tab untuk monitor API calls
- localStorage.getItem('token') untuk check auth

### Frontend Mobile
- React Native Debugger
- console.log di terminal untuk debug
- AsyncStorage.getItem untuk check storage

## 🐛 Common Issues & Solutions

### Issue: CORS Error
```js
// backend/server.js sudah diset
// Pastikan origin match dengan frontend URL
```

### Issue: MongoDB Connection
```
// Check MongoDB service running
// Verify MONGODB_URI di .env
```

### Issue: JWT Expired
```js
// Token expire 30 hari
// Refresh atau re-login
```

### Issue: Image Upload
```
// Pastikan Cloudinary config benar di .env
// Check file size limit (max 5MB)
```

### Issue: Tailwind Not Working
```bash
# Web
npm run dev # restart dev server

# Mobile
npx react-native start --reset-cache
```

## 📞 API Testing Examples

### Register User
```bash
POST http://localhost:5000/api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "phone": "081234567890",
  "rt": "01"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
{
  "email": "john@example.com",
  "password": "123456"
}
```

### Create Schedule (Admin)
```bash
POST http://localhost:5000/api/schedules
Headers: Authorization: Bearer {token}
{
  "rt": "01",
  "date": "2025-10-15",
  "assignedUsers": ["user_id_1", "user_id_2"],
  "notes": "Ronda malam shift 1"
}
```

### Create Attendance
```bash
POST http://localhost:5000/api/attendances
Headers:
  Authorization: Bearer {token}
  Content-Type: multipart/form-data
Body:
  scheduleId: {schedule_id}
  status: "hadir"
  photo: {file}
```

## 🎯 Next Development Steps

### Priority 1 - Essential (Week 1)
1. ✅ Backend API (DONE)
2. 🔄 Frontend Web: Auth + Dashboard
3. 🔄 Frontend Web: Users & Schedules management

### Priority 2 - Core Features (Week 2)
4. Frontend Web: Attendance monitoring
5. Frontend Mobile: Setup + Auth
6. Frontend Mobile: Attendance feature

### Priority 3 - Advanced (Week 3)
7. Frontend Web: Analytics & Export
8. Frontend Mobile: Schedule & History
9. UI/UX Polish & Animations

### Priority 4 - Final (Week 4)
10. Testing & Bug fixes
11. Deployment preparation
12. Documentation

## 📚 Resources

### Documentation Links
- React: https://react.dev
- React Native: https://reactnative.dev
- Tailwind: https://tailwindcss.com
- Recharts: https://recharts.org
- Framer Motion: https://www.framer.com/motion/

### Sample Code Snippets
Lihat folder `/examples` untuk:
- Auth implementation
- API integration
- Form handling
- File upload
- Charts implementation

## 🚀 Deployment

### Backend (API)
- Platform: Railway, Render, or Heroku
- Environment variables di platform
- MongoDB Atlas untuk production

### Frontend Web
- Platform: Vercel or Netlify
- Build: `npm run build`
- Set API_URL env variable

### Frontend Mobile
- Android: Build APK/AAB
- iOS: Build IPA (need Mac)
- Deploy to Play Store / App Store

---

**Happy Coding! 🎉**

Jika ada pertanyaan, refer ke README.md atau check dokumentasi official dari masing-masing teknologi.
