// Export all API modules
export * as authAPI from './auth';
export * as schedulesAPI from './schedules';
export * as attendancesAPI from './attendances';
export * as dashboardAPI from './dashboard';
export * as notificationsAPI from './notifications';
export * as activitiesAPI from './activities';

// Export client for custom requests
export { default as client } from './client';
export { createFormDataClient } from './client';
