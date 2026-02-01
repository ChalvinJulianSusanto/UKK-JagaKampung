import client from './client';

// IURAN
export const getAllIuran = async (params) => {
    try {
        const response = await client.get('/iuran', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getIuranSummary = async (params) => {
    try {
        const response = await client.get('/iuran/summary', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// INCOME
export const getAllIncome = async (params) => {
    try {
        const response = await client.get('/income', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getIncomeSummary = async (params) => {
    try {
        const response = await client.get('/income/summary', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// BUDGET
export const getAllBudgets = async (params) => {
    try {
        const response = await client.get('/budgets', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getBudgetSummary = async (params) => {
    try {
        const response = await client.get('/budgets/summary', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};
