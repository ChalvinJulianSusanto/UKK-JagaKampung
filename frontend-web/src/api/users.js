import apiClient from './client';

export const usersAPI = {
  // Get all users
  getAll: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // Ban/Unban user
  toggleBan: async (id) => {
    const response = await apiClient.put(`/users/${id}/ban`);
    return response.data;
  },

  // Get users by RT
  getByRT: async (rtNumber) => {
    const response = await apiClient.get(`/users/rt/${rtNumber}`);
    return response.data;
  },
};
