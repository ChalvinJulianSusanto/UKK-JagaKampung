import apiClient from './client';

export const activitiesAPI = {
    // Get all activities
    getAll: async (params = {}) => {
        const response = await apiClient.get('/activities', { params });
        return response.data;
    },

    // Get single activity by ID
    getById: async (id) => {
        const response = await apiClient.get(`/activities/${id}`);
        return response.data;
    },

    // Create new activity
    create: async (formData) => {
        const response = await apiClient.post('/activities', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update activity
    update: async (id, formData) => {
        const response = await apiClient.put(`/activities/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete activity
    delete: async (id) => {
        const response = await apiClient.delete(`/activities/${id}`);
        return response.data;
    },

    // Upload documentation photos only
    uploadDocumentation: async (id, formData) => {
        const response = await apiClient.post(`/activities/${id}/documentation`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
