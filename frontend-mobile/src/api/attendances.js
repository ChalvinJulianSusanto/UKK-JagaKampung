import { createFormDataClient } from './client';
import client from './client';

/**
 * Attendances API
 */

// Create new attendance (with photo)
export const createAttendance = async (data) => {
  const formDataClient = createFormDataClient();
  
  // Jika data sudah FormData, langsung kirim
  if (data instanceof FormData) {
    const response = await formDataClient.post('/attendances', data);
    return response.data;
  }

  // Jika data adalah object, convert ke FormData
  const formData = new FormData();
  if (data.scheduleId) formData.append('scheduleId', data.scheduleId);
  if (data.schedule) formData.append('scheduleId', data.schedule);
  if (data.status) formData.append('status', data.status);
  if (data.type) formData.append('type', data.type);
  if (data.photo) formData.append('photo', data.photo);
  if (data.reason) formData.append('reason', data.reason);
  if (data.location) {
    formData.append('location', typeof data.location === 'string' ? data.location : JSON.stringify(data.location));
  }

  const response = await formDataClient.post('/attendances', formData);
  return response.data;
};

// Get user's attendance history
export const getMyAttendanceHistory = async (params = {}) => {
  const response = await client.get('/attendances/my-history', { params });
  return response.data;
};

// Get all attendances (admin only, but we can still call it)
export const getAllAttendances = async (params = {}) => {
  const response = await client.get('/attendances', { params });
  return response.data;
};

// Get attendances by RT
export const getAttendancesByRT = async (rtNumber, params = {}) => {
  const response = await client.get(`/attendances/rt/${rtNumber}`, { params });
  return response.data;
};

// Delete attendance by ID
export const deleteAttendance = async (id) => {
  const response = await client.delete(`/attendances/${id}`);
  return response.data;
};

// Check if user has already attended today for a schedule
export const checkTodayAttendance = async (scheduleId) => {
  const response = await client.get(`/attendances/check-today/${scheduleId}`);
  return response.data;
};
