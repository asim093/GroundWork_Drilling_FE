import { api } from './api.js';

export const getReportSummary = async (params) => {
  const { data } = await api.get('/time-logs/reports/summary', { params });
  return data.data;
};

export const getMyReport = async (params) => {
  const { data } = await api.get('/time-logs/reports/mine', { params });
  return data.data;
};

export const getMonthlyComparison = async (params) => {
  const { data } = await api.get('/time-logs/reports/monthly-comparison', { params });
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

export const downloadReport = async ({ scope, format, params, charts }) => {
  const path =
    scope === 'mine'
      ? '/time-logs/reports/mine/export'
      : '/time-logs/reports/summary/export';

  const query = { params: { ...params, format }, responseType: 'blob' };
  const chartImages = Array.isArray(charts) ? charts.filter((chart) => chart && chart.dataUrl) : [];

  const response = chartImages.length
    ? await api.post(path, { charts: chartImages }, query)
    : await api.get(path, query);

  const fallback = `groundwork-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  const filename = parseFilename(response.headers['content-disposition'], fallback);
  triggerDownload(response.data, filename);
};
