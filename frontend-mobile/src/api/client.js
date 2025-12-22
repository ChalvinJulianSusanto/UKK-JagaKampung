import axios from 'axios';
import toast from 'react-hot-toast';

// Temporary hardcoded for production - will use env var when available
const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname.includes('vercel.app')
    ? 'https://ukk-jagakampung.onrender.com/api'
    : 'http://localhost:5000/api');

// Create axios instance
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
client.interceptors.request.use(
  (config) => {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error - Cannot connect to server');
      console.error('API URL:', API_URL);
      toast.error(`Tidak dapat terhubung ke server. Pastikan backend running di ${API_URL.replace('/api', '')}`);
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const requestUrl = error.config?.url || '';

    // Check if this is a schedule request (don't show toast for 404)
    const isScheduleRequest = requestUrl.includes('/schedules');

    // Handle specific status codes
    switch (status) {
      case 400:
        // Don't show toast for 400, let component handle it
        break;
      case 401:
        // Only show toast and redirect if not on login page
        const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';
        if (!isLoginPage) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
          // Clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        break;
      case 403:
        toast.error('Anda tidak memiliki akses ke resource ini');
        break;
      case 404:
        // Don't show toast for schedule 404 (normal if schedule not uploaded yet)
        if (!isScheduleRequest) {
          toast.error(data.message || 'Resource tidak ditemukan');
        }
        break;
      case 409:
        toast.error(data.message || 'Data sudah ada');
        break;
      case 500:
        toast.error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
        break;
      default:
        toast.error(data.message || 'Terjadi kesalahan. Silakan coba lagi.');
    }

    return Promise.reject(error);
  }
);

// Helper function for FormData requests
export const createFormDataClient = () => {
  const formDataClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60 seconds for file uploads
  });

  // Add same interceptors
  formDataClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  formDataClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        toast.error('Tidak dapat terhubung ke server');
        return Promise.reject(error);
      }
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        toast.error(data.message || 'Terjadi kesalahan');
      }
      return Promise.reject(error);
    }
  );

  return formDataClient;
};

export default client;
