import client from './client';

const BASE_URL = '/income';

export const incomeAPI = {
    // Get all income records with optional filters
    getAll: async (params = {}) => {
        try {
            const response = await client.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Gagal memuat data pemasukan' };
        }
    },

    // Get income summary
    getSummary: async (params = {}) => {
        try {
            const response = await client.get(`${BASE_URL}/summary`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Gagal memuat ringkasan pemasukan' };
        }
    },

    // Create new income record
    create: async (data) => {
        try {
            const response = await client.post(BASE_URL, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Gagal menambahkan data pemasukan' };
        }
    },

    // Update income record
    update: async (id, data) => {
        try {
            const response = await client.put(`${BASE_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Gagal memperbarui data pemasukan' };
        }
    },

    // Delete income record
    delete: async (id) => {
        try {
            const response = await client.delete(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Gagal menghapus data pemasukan' };
        }
    }
};

