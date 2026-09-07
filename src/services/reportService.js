import { api } from './api.js';

export const getReportSummary = async (params) => {
  const { data } = await api.get('/time-logs/reports/summary', { params });
  return data.data;
};

export const getMonthlyComparison = async (params) => {
  const { data } = await api.get('/time-logs/reports/monthly-comparison', { params });
  return data.data;
};
