import client, { createFormDataClient } from './client';

/**
 * Authentication API
 */

// Register new user
export const register = async (data) => {
  const response = await client.post('/auth/register', data);
  return response.data;
};

// Login user
export const login = async (credentials) => {
  const response = await client.post('/auth/login', credentials);
  return response.data;
};

// Get current user profile
export const getProfile = async () => {
  const response = await client.get('/auth/profile');
  return response.data;
};

// Get current user (me)
export const getMe = async () => {
  const response = await client.get('/auth/me');
  return response.data;
};

// Update user profile
export const updateProfile = async (data) => {
  const formDataClient = createFormDataClient();
  
  let payload;
  
  if (data instanceof FormData) {
    payload = data;
  } else {
    payload = new FormData();
    // Append all fields to FormData
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        payload.append(key, data[key]);
      }
    });
  }

  const response = await formDataClient.put('/auth/profile', payload);
  return response.data;
};

// Logout (client-side only)
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
};
