import apiClient from './client';

export const dashboardAPI = {
  // Get dashboard stats (Admin only)
  getStats: async (params = {}) => {
    const response = await apiClient.get('/dashboard/stats', { params });
    return response.data;
  },

  // Get weekly stats (Admin only)
  getWeeklyStats: async (params = {}) => {
    const response = await apiClient.get('/dashboard/weekly-stats', { params });
    return response.data;
  },

  // Get monthly stats (Admin only)
  getMonthlyStats: async (params = {}) => {
    const response = await apiClient.get('/dashboard/monthly-stats', { params });
    return response.data;
  },

  // Get user's personal stats
  getUserStats: async () => {
    const response = await apiClient.get('/dashboard/user-stats');
    return response.data;
  },

  // Get user's personal weekly stats
  getUserWeeklyStats: async () => {
    const response = await apiClient.get('/dashboard/user-weekly-stats');
    return response.data;
  },

  // Get user's personal monthly stats
  getUserMonthlyStats: async () => {
    const response = await apiClient.get('/dashboard/user-monthly-stats');
    return response.data;
  },

  // Export to Excel
  exportToExcel: async (params = {}) => {
    const response = await apiClient.get('/dashboard/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Export to PDF
  exportToPDF: async (params = {}) => {
    const response = await apiClient.get('/dashboard/export-pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Get report preview/summary
  getReportPreview: async (params = {}) => {
    const response = await apiClient.get('/dashboard/report-preview', { params });
    return response.data;
  },
};
