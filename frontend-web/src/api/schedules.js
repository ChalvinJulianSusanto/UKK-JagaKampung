import apiClient from './client';

export const schedulesAPI = {
  // Create schedule container (no file upload)
  create: async (data) => {
    const response = await apiClient.post('/schedules', data);
    return response.data;
  },

  // Get all schedules with filters
  // UPDATE: Ditambahkan headers anti-cache agar data selalu fresh
  getAll: async (params = {}) => {
    const response = await apiClient.get('/schedules', { 
      params,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    return response.data;
  },

  // Get schedule by ID
  getById: async (id) => {
    const response = await apiClient.get(`/schedules/${id}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.data;
  },

  // Get schedule by RT, month and year
  getScheduleByMonth: async (rt, year, month) => {
    const response = await apiClient.get(`/schedules/month/${rt}/${year}/${month}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.data;
  },

  // Delete schedule
  delete: async (id) => {
    const response = await apiClient.delete(`/schedules/${id}`);
    return response.data;
  },

  // Add entry to schedule
  addEntry: async (scheduleId, entryData) => {
    const response = await apiClient.post(`/schedules/${scheduleId}/entries`, entryData);
    return response.data;
  },

  // Update entry in schedule
  updateEntry: async (scheduleId, entryId, entryData) => {
    const response = await apiClient.put(`/schedules/${scheduleId}/entries/${entryId}`, entryData);
    return response.data;
  },

  // Delete entry from schedule
  deleteEntry: async (scheduleId, entryId) => {
    const response = await apiClient.delete(`/schedules/${scheduleId}/entries/${entryId}`);
    return response.data;
  },
};

// Export individual functions for backward compatibility
export const getSchedules = schedulesAPI.getAll;
export const getScheduleById = schedulesAPI.getById;
export const getScheduleByMonth = schedulesAPI.getScheduleByMonth;

// Get current month schedule
export const getCurrentMonthSchedule = async () => {
  try {
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (!userJson) {
      throw new Error('User tidak ditemukan. Silakan login kembali.');
    }

    const user = JSON.parse(userJson);
    const rt = user.rt;

    if (!rt) {
      console.error('User data:', user);
      throw new Error('RT tidak ditemukan pada profil user');
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // UPDATE: Tambahkan header anti-cache juga di sini
    const response = await apiClient.get(`/schedules/month/${rt}/${year}/${month}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.data;
  } catch (error) {
    console.error('Error in getCurrentMonthSchedule:', error);

    if (error.response?.status === 404) {
      return {
        success: false,
        message: 'Jadwal untuk bulan ini belum tersedia',
        data: null
      };
    }

    throw error;
  }
};