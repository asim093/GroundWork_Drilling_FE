import { api } from './api.js';

export const getHoursReport = async (params) => {
  const { data } = await api.get('/time-logs/reports/hours', { params });
  return data.data;
};

export const getConsumablesReport = async (params) => {
  const { data } = await api.get('/time-logs/reports/consumables', { params });
  return data.data;
};

export const getFuelReport = async (params) => {
  const { data } = await api.get('/time-logs/reports/fuel', { params });
  return data.data;
};

export const getMyReport = async (params) => {
  const { data } = await api.get('/time-logs/reports/mine', { params });
  return data.data;
};

const parseFilename = (disposition, fallback) => {
  const match = /filename="?([^"]+)"?/.exec(disposition || '');
  return match ? match[1] : fallback;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 10000);
};

const EXPORT_PATHS = {
  hours: '/time-logs/reports/hours/export',
  consumables: '/time-logs/reports/consumables/export',
  fuel: '/time-logs/reports/fuel/export'
};

export const downloadReport = async ({ report, format, params }) => {
  const path = EXPORT_PATHS[report];
  const response = await api.get(path, { params: { ...params, format }, responseType: 'blob' });
  const fallback = `groundwork-${report}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  const filename = parseFilename(response.headers['content-disposition'], fallback);
  triggerDownload(response.data, filename);
};
