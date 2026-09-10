import { api } from './api.js';

const makeMasterDataService = (basePath) => ({
  list: async (params) => {
    const { data } = await api.get(basePath, { params });
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post(basePath, payload);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`${basePath}/${id}`, payload);
    return data.data;
  },
  deactivate: async (id) => {
    const { data } = await api.delete(`${basePath}/${id}`);
    return data.data;
  }
});

export const locationsService = makeMasterDataService('/locations');
export const rigNumbersService = makeMasterDataService('/rig-numbers');
export const drillNumbersService = makeMasterDataService('/drill-numbers');
export const consumablesService = makeMasterDataService('/consumables');
export const activityCategoriesService = makeMasterDataService('/activity-categories');
export const activitiesService = makeMasterDataService('/activities');
export const employeesService = makeMasterDataService('/employees');
