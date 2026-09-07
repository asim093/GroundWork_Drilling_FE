import { api } from './api.js';

export const listScheduling = async (params) => {
  const { data } = await api.get('/time-logs/scheduling', { params });
  return data;
};
