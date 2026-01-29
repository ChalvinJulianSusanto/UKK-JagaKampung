import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Loading from './components/common/Loading';
import { lazyWithPreload } from './utils/lazyWithPreload';

// Lazy load components untuk code splitting dengan preload support
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazyWithPreload(() => import('./pages/Dashboard'));
const Users = lazyWithPreload(() => import('./pages/Users'));
const Schedules = lazyWithPreload(() => import('./pages/Schedules'));
const Attendances = lazyWithPreload(() => import('./pages/Attendances'));
const Reports = lazyWithPreload(() => import('./pages/Reports'));
const Activities = lazyWithPreload(() => import('./pages/Activities'));
const Finances = lazyWithPreload(() => import('./pages/Finances'));
const FinanceManagement = lazyWithPreload(() => import('./pages/FinanceManagement'));
const Settings = lazyWithPreload(() => import('./pages/Settings'));

// Export lazy components untuk prefetching
export const lazyComponents = {
  Dashboard,
  Users,
  Schedules,
  Attendances,
  Reports,
  Activities,
  Finances,
  FinanceManagement,
  Settings,
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Component - hanya untuk admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#424242',
            },
            success: {
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#F44336',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Suspense fallback={<Loading fullScreen delay={200} />}>
                  <Login />
                </Suspense>
              </PublicRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Suspense fallback={<Loading fullScreen delay={200} />}>
                  <MainLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <Suspense fallback={<Loading delay={150} />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="users" element={
              <AdminRoute>
                <Suspense fallback={<Loading delay={150} />}>
                  <Users />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="schedules" element={
              <Suspense fallback={<Loading delay={150} />}>
                <Schedules />
              </Suspense>
            } />
            <Route path="attendances" element={
              <Suspense fallback={<Loading delay={150} />}>
                <Attendances />
              </Suspense>
            } />
            <Route path="reports" element={
              <AdminRoute>
                <Suspense fallback={<Loading delay={150} />}>
                  <Reports />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="activities" element={
              <AdminRoute>
                <Suspense fallback={<Loading delay={150} />}>
                  <Activities />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="finances" element={
              <AdminRoute>
                <Suspense fallback={<Loading delay={150} />}>
                  <Finances />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="finance-management" element={
              <AdminRoute>
                <Suspense fallback={<Loading delay={150} />}>
                  <FinanceManagement />
                </Suspense>
              </AdminRoute>
            } />
            <Route path="settings" element={
              <Suspense fallback={<Loading delay={150} />}>
                <Settings />
              </Suspense>
            } />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
