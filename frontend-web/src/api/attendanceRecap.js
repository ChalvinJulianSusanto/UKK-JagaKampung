import api from './client';

export const attendanceRecapAPI = {
    // Create new recap (admin only)
    createRecap: async (formData) => {
        const response = await api.post('/attendance-recaps', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Get all recaps with filters
    getAllRecaps: async (params = {}) => {
        const response = await api.get('/attendance-recaps', { params });
        return response.data;
    },

    // Get today's recaps
    getTodayRecaps: async (rt = null) => {
        const params = rt ? { rt } : {};
        const response = await api.get('/attendance-recaps/today', { params });
        return response.data;
    },

    // Get single recap
    getRecapById: async (id) => {
        const response = await api.get(`/attendance-recaps/${id}`);
        return response.data;
    },

    // Update recap (admin only)
    updateRecap: async (id, formData) => {
        const response = await api.put(`/attendance-recaps/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Delete recap (admin only)
    deleteRecap: async (id) => {
        const response = await api.delete(`/attendance-recaps/${id}`);
        return response.data;
    }
};
