import api from './client';

export const getAll = (params) => {
    return api.get('/activities', { params });
};

export const getById = (id) => {
    return api.get(`/activities/${id}`);
};
