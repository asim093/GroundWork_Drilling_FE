import { api } from './api.js';

export const loginRequest = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const fetchInvite = async (token) => {
  const { data } = await api.get('/auth/invite', { params: { token } });
  return data.data;
};

export const acceptInvite = async (token, password) => {
  const { data } = await api.post('/auth/accept-invite', { token, password });
  return data;
};
