import client from './client';

// Iuran API endpoints
export const iuranAPI = {
    // Get all iuran records
    getAll: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await client.get(`/iuran${queryString ? `?${queryString}` : ''}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch iuran data' };
        }
    },

    // Get iuran summary
    getSummary: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await client.get(`/iuran/summary${queryString ? `?${queryString}` : ''}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch iuran summary' };
        }
    },

    // Get single iuran by ID
    getById: async (id) => {
        try {
            const response = await client.get(`/iuran/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch iuran' };
        }
    },

    // Create new iuran
    create: async (data) => {
        try {
            const response = await client.post('/iuran', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create iuran' };
        }
    },

    // Update iuran
    update: async (id, data) => {
        try {
            const response = await client.put(`/iuran/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update iuran' };
        }
    },

    // Delete iuran
    delete: async (id) => {
        try {
            const response = await client.delete(`/iuran/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete iuran' };
        }
    },
};

// Budget API endpoints
export const budgetAPI = {
    // Get all budget records
    getAll: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await client.get(`/budgets${queryString ? `?${queryString}` : ''}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch budget data' };
        }
    },

    // Get budget summary
    getSummary: async (params = {}) => {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await client.get(`/budgets/summary${queryString ? `?${queryString}` : ''}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch budget summary' };
        }
    },

    // Get single budget by ID
    getById: async (id) => {
        try {
            const response = await client.get(`/budgets/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch budget' };
        }
    },

    // Create new budget
    create: async (data) => {
        try {
            const response = await client.post('/budgets', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create budget' };
        }
    },

    // Update budget
    update: async (id, data) => {
        try {
            const response = await client.put(`/budgets/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update budget' };
        }
    },

    // Delete budget
    delete: async (id) => {
        try {
            const response = await client.delete(`/budgets/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete budget' };
        }
    },
};
