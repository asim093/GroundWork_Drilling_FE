import { api } from './api.js';

export const getBonusConfig = async () => {
  const { data } = await api.get('/bonus-config');
  return data.data;
};

export const updateBonusConfig = async (payload) => {
  const { data } = await api.patch('/bonus-config', payload);
  return data.data;
};
