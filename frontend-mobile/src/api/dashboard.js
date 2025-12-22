import client from './client';

/**
 * Dashboard & Statistics API
 */

// Get dashboard statistics
export const getDashboardStats = async (params = {}) => {
  const response = await client.get('/dashboard/stats', { params });
  return response.data;
};

// Get weekly statistics
export const getWeeklyStats = async (params = {}) => {
  const response = await client.get('/dashboard/weekly-stats', { params });
  return response.data;
};

// Get monthly statistics
export const getMonthlyStats = async (params = {}) => {
  const response = await client.get('/dashboard/monthly-stats', { params });
  return response.data;
};

// Get report preview
export const getReportPreview = async (params = {}) => {
  const response = await client.get('/dashboard/report-preview', { params });
  return response.data;
};

// Export to Excel
export const exportToExcel = async (params = {}) => {
  const response = await client.get('/dashboard/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// Export to PDF
export const exportToPDF = async (params = {}) => {
  const response = await client.get('/dashboard/export-pdf', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// Get user-specific statistics
export const getUserStats = async () => {
  const response = await client.get('/dashboard/user-stats');
  return response.data;
};

// Get user's personal weekly stats
export const getUserWeeklyStats = async () => {
  const response = await client.get('/dashboard/user-weekly-stats');
  return response.data;
};

// Get user's personal monthly stats
export const getUserMonthlyStats = async (params = {}) => {
  const response = await client.get('/dashboard/user-monthly-stats', { params });
  return response.data;
};