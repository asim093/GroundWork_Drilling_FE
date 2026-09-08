import { api } from './api.js';

const groupBy = (items, groupKey, mapItem) => {
  const groups = new Map();

  items.forEach((item) => {
    const group = item[groupKey] || 'Other';
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(mapItem(item));
  });

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([group, groupItems]) => ({ group, items: groupItems }));
};

export const listActivityOptions = async () => {
  const { data } = await api.get('/catalog/activities');
  return {
    items: data.data,
    grouped: groupBy(data.data, 'category', (item) => ({ value: item.id, label: item.name }))
  };
};

export const listConsumableOptions = async () => {
  const { data } = await api.get('/catalog/consumables');
  return {
    items: data.data,
    grouped: groupBy(data.data, 'group', (item) => item.name)
  };
};
