import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './common';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen size="lg" text="Memuat..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // PREREQUISITE: Basic Info Check (RT & Phone)
  // For new Google users, these might be missing. We MUST force them to complete profile first.
  const isProfileIncomplete = !user?.rt || !user?.phone;

  if (isProfileIncomplete) {
    if (location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
    return children;
  }

  // Handle Complete Profile page access for users who DONT need it
  if (!isProfileIncomplete && location.pathname === '/complete-profile') {
    // If they are pending, go to pending verification
    if (user?.status === 'pending') {
      return <Navigate to="/pending-verification" replace />;
    }
    // If active, go home
    return <Navigate to="/" replace />;
  }

  // Handle Pending Status
  if (user?.status === 'pending') {
    // Allows access only to pending-verification page
    if (location.pathname !== '/pending-verification') {
      return <Navigate to="/pending-verification" replace />;
    }
    return children;
  }

  // Handle Active Status trying to access pending page
  if (user?.status === 'active' && location.pathname === '/pending-verification') {
    return <Navigate to="/" replace />;
  }

  // Block Banned Users (Optional, but good practice)
  if (user?.status === 'banned') {
    // You might want a specific banned page, or just logout them/show error
    // For now, let's just let the API handle 403s or redirect to login
    // return <Navigate to="/login" replace />; 
  }

  return children;
};

export default ProtectedRoute;
