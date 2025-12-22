import apiClient from './client';

export const attendancesAPI = {
  // Get all attendances
  getAll: async (params = {}) => {
    const response = await apiClient.get('/attendances', { params });
    return response.data;
  },

  // Get my attendance history
  getMyHistory: async () => {
    const response = await apiClient.get('/attendances/my-history');
    return response.data;
  },

  // Get my attendances (alias for getMyHistory for compatibility)
  getMyAttendances: async (params = {}) => {
    const response = await apiClient.get('/attendances/my-history', { params });
    return response.data;
  },

  // Create attendance (check-in)
  create: async (formData) => {
    const response = await apiClient.post('/attendances', formData);
    return response.data;
  },

  // Get attendances by RT
  getByRT: async (rtNumber, params = {}) => {
    const response = await apiClient.get(`/attendances/rt/${rtNumber}`, { params });
    return response.data;
  },

  // Approve/Reject attendance
  approve: async (id, approved) => {
    const response = await apiClient.put(`/attendances/${id}/approve`, { approved });
    return response.data;
  },

  // Delete attendance
  delete: async (id) => {
    const response = await apiClient.delete(`/attendances/${id}`);
    return response.data;
  },
};
