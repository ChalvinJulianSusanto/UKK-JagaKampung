import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import { MainLayout } from './components/layout';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import NotificationToast from './components/NotificationToast';
import { notificationsAPI } from './api';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import Schedule from './pages/Schedule';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AttendanceCalendar from './pages/AttendanceCalendar';
import CompleteProfile from './pages/CompleteProfile';

// Public Route wrapper - redirect to home if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255,255,255,0.3)',
            borderTop: '5px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Memuat...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="history" element={<History />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="attendance-calendar" element={<AttendanceCalendar />} />
      </Route>

      {/* Complete Profile Route - Protected but separate from main layout */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Notification Toast Manager
function NotificationManager() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [toastNotification, setToastNotification] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Check for new notifications every 10 seconds
    const checkNewNotifications = async () => {
      try {
        const response = await notificationsAPI.getNotifications({ limit: 1 });
        if (response.success && response.data.length > 0) {
          const latestNotif = response.data[0];
          const lastSeenId = localStorage.getItem('lastSeenNotificationId');

          // If this is a new notification we haven't seen
          if (latestNotif._id !== lastSeenId) {
            setToastNotification(latestNotif);
            localStorage.setItem('lastSeenNotificationId', latestNotif._id);
          }
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Initial check
    checkNewNotifications();

    // Then check every 10 seconds
    const interval = setInterval(checkNewNotifications, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const handleToastClose = () => {
    setToastNotification(null);
  };

  const handleToastNavigate = (notification) => {
    setToastNotification(null);
    navigate('/notifications');
  };

  return (
    <NotificationToast
      notification={toastNotification}
      onClose={handleToastClose}
      onNavigate={handleToastNavigate}
    />
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <NotificationManager />
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#d53030ff',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
