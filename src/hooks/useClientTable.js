import { useMemo } from 'react';
import { useListParams } from './useListParams.js';
import { applyClientTable } from '../lib/clientTable.js';

export const useClientTable = (rows, { searchFields = [], defaultSort, defaultOrder = 'asc' } = {}) => {
  const { filters, sort, order, limit, page, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: defaultSort, order: defaultOrder });

  const view = useMemo(
    () =>
      applyClientTable(rows, {
        search: filters.search,
        searchFields,
        sort,
        order,
        page,
        limit
      }),
    [rows, filters.search, searchFields, sort, order, page, limit]
  );

  return {
    data: view.data,
    pagination: view.pagination,
    sort,
    order,
    toggleSort,
    limit,
    setPage,
    setLimit,
    search: filters.search || '',
    setSearch: (value) => setFilter('search', value)
  };
};
