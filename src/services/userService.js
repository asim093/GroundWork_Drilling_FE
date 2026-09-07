import { api } from './api.js';

export const listUsers = async (params) => {
  const { data } = await api.get('/users', { params });
  return data;
};

export const getUser = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
};

export const createUser = async (payload) => {
  const { data } = await api.post('/users', payload);
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.data;
};

export const resendInvite = async (id) => {
  const { data } = await api.post(`/users/${id}/resend-invite`);
  return data;
};
