import { api } from './api.js';

export const getDashboard = async () => {
  const { data } = await api.get('/dashboard');
  return data.data;
};

export const getAttention = async () => {
  const { data } = await api.get('/dashboard/attention');
  return data.data;
};
