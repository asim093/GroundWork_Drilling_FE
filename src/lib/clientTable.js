export const applyClientTable = (
  rows,
  { search, searchFields = [], sort, order = 'asc', page = 1, limit = 10 } = {}
) => {
  let working = Array.isArray(rows) ? [...rows] : [];

  const term = String(search || '').trim().toLowerCase();
  if (term && searchFields.length) {
    working = working.filter((row) =>
      searchFields.some((field) => String(row[field] ?? '').toLowerCase().includes(term))
    );
  }

  if (sort) {
    working.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av === null || av === undefined) {
        return bv === null || bv === undefined ? 0 : 1;
      }
      if (bv === null || bv === undefined) {
        return -1;
      }
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return order === 'asc' ? cmp : -cmp;
    });
  }

  const total = working.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    data: working.slice(start, start + limit),
    pagination: { page: safePage, limit, total, totalPages }
  };
};
