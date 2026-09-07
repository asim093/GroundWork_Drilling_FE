import { useCallback, useMemo, useState } from 'react';

export const useListParams = ({ sort, order = 'asc', limit = 10, filters = {} }) => {
  const [state, setState] = useState({ page: 1, limit, sort, order, filters });

  const setPage = useCallback((page) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((nextLimit) => {
    setState((prev) => ({ ...prev, limit: nextLimit, page: 1 }));
  }, []);

  const toggleSort = useCallback((field) => {
    setState((prev) => ({
      ...prev,
      page: 1,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const setFilter = useCallback((key, value) => {
    setState((prev) => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, [key]: value || undefined }
    }));
  }, []);

  const queryParams = useMemo(
    () => ({
      page: state.page,
      limit: state.limit,
      sort: state.sort,
      order: state.order,
      ...state.filters
    }),
    [state]
  );

  return {
    page: state.page,
    limit: state.limit,
    sort: state.sort,
    order: state.order,
    filters: state.filters,
    queryParams,
    setPage,
    setLimit,
    toggleSort,
    setFilter
  };
};
