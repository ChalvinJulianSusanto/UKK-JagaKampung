import client from './client';

/**
 * Notifications API
 */

// Get user notifications
export const getNotifications = async (params = {}) => {
  const response = await client.get('/notifications', { params });
  return response.data;
};

// Get unread count
export const getUnreadCount = async () => {
  const response = await client.get('/notifications/unread-count');
  return response.data;
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  const response = await client.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await client.put('/notifications/mark-all-read');
  return response.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const response = await client.delete(`/notifications/${notificationId}`);
  return response.data;
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  const response = await client.delete('/notifications');
  return response.data;
};
