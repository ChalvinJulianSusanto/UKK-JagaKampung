import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);

        // Verify token is still valid by fetching fresh user data
        // Add timeout to prevent hanging if backend is unreachable
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );

          const response = await Promise.race([authAPI.getMe(), timeoutPromise]);

          if (response.success && response.data) {
            const freshUser = response.data;
            setUser(freshUser);

            // Update stored user data
            if (localStorage.getItem('token')) {
              localStorage.setItem('user', JSON.stringify(freshUser));
            } else {
              sessionStorage.setItem('user', JSON.stringify(freshUser));
            }
          }
        } catch (error) {
          // If timeout or error, keep using cached user data
          console.log('Could not verify token (offline or timeout), using cached user data');
          // Don't logout on timeout - user might be offline
          if (error.message !== 'Timeout' && error.response?.status === 401) {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, rememberMe = false) => {
    try {
      console.log('Attempting login with:', { email: credentials.email, rememberMe });
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);

      if (response.success && response.data) {
        // Extract token from response.data (backend returns token inside data object)
        const { token, ...userData } = response.data;

        if (!token) {
          throw new Error('Token tidak ditemukan dalam response');
        }

        // Store token and user data
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', token);
        storage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        toast.success(`Selamat datang, ${userData.name}!`);
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login gagal. Periksa email dan password Anda.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      if (response.success) {
        toast.success('Registrasi berhasil! Silakan login.');
        return { success: true };
      } else {
        throw new Error(response.message || 'Registrasi gagal');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registrasi gagal';
      toast.error(message);
      return { success: false, message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const response = await authAPI.googleLogin(credential);

      if (response.success && response.data) {
        const { token, ...userData } = response.data;

        if (!token) {
          throw new Error('Token tidak ditemukan dalam response');
        }

        // Store in localStorage for Google login (remember forever)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        toast.success(`Selamat datang, ${userData.name}!`);
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Google login gagal');
      }
    } catch (error) {
      console.error('Google login error:', error);
      const message = error.response?.data?.message || error.message || 'Google login gagal';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Clear Google credentials by revoking access
    // This will clear the "Login sebagai Chalvin" prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Clear state
    setUser(null);
    setIsAuthenticated(false);

    toast.success('Anda telah logout');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);

    // Update stored user data
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(updatedUserData));
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      if (response.success && response.data) {
        updateUser(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
