import { api } from './api.js';

export const listJobs = async (params) => {
  const { data } = await api.get('/jobs', { params });
  return data;
};

export const getJob = async (id) => {
  const { data } = await api.get(`/jobs/${id}`);
  return data.data;
};

export const createJob = async (payload) => {
  const { data } = await api.post('/jobs', payload);
  return data.data;
};

export const updateJob = async (id, payload) => {
  const { data } = await api.patch(`/jobs/${id}`, payload);
  return data.data;
};

export const archiveJob = async (id) => {
  const { data } = await api.post(`/jobs/${id}/archive`);
  return data.data;
};

export const unarchiveJob = async (id) => {
  const { data } = await api.post(`/jobs/${id}/unarchive`);
  return data.data;
};
