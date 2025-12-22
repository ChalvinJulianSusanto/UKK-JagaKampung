import apiClient from './client';

export const authAPI = {
  // Register
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials, rememberMe = false) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.success) {
      const storage = rememberMe ? localStorage : sessionStorage;

      // Clear both storages first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Store in appropriate storage
      storage.setItem('token', response.data.data.token);
      storage.setItem('user', JSON.stringify(response.data.data));

      // Store remember preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await apiClient.put('/auth/profile', userData);
    if (response.data.success) {
      // Update stored user data
      const rememberMe = localStorage.getItem('rememberMe');
      const storage = rememberMe ? localStorage : sessionStorage;
      const currentUser = JSON.parse(storage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data.data };
      storage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  },
};
