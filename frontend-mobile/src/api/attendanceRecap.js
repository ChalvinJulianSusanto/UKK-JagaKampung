import { client as api } from './index';

// Get today's recaps for mobile display
export const getTodayRecaps = async (rt = 'all') => {
    try {
        const params = rt !== 'all' ? { rt } : {};
        const response = await api.get('/attendance-recaps/today', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching today recaps:', error);
        return { success: false, data: [] };
    }
};

// Get all recaps with filters
export const getAllRecaps = async (params = {}) => {
    try {
        const response = await api.get('/attendance-recaps', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching recaps:', error);
        return { success: false, data: [] };
    }
};
