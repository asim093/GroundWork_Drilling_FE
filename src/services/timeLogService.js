import { api } from './api.js';

export const listAssignedJobs = async (params) => {
  const { data } = await api.get('/jobs/assigned', { params });
  return data;
};

export const getAssignedJob = async (id) => {
  const { data } = await api.get(`/jobs/assigned/${id}`);
  return data.data;
};

export const listMyTimeLogs = async (params) => {
  const { data } = await api.get('/time-logs/mine', { params });
  return data;
};

export const listTimeLogs = async (params) => {
  const { data } = await api.get('/time-logs', { params });
  return data;
};

export const getTimeLog = async (id) => {
  const { data } = await api.get(`/time-logs/${id}`);
  return data.data;
};

export const createTimeLog = async (payload) => {
  const { data } = await api.post('/time-logs', payload);
  return data.data;
};

export const updateTimeLog = async (id, payload) => {
  const { data } = await api.patch(`/time-logs/${id}`, payload);
  return data.data;
};

export const submitTimeLog = async (id) => {
  const { data } = await api.post(`/time-logs/${id}/submit`);
  return data.data;
};
