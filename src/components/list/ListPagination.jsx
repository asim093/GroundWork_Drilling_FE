import { Group, Pagination, Select, Text } from '@mantine/core';

const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

const MIN_ROWS_TO_PAGINATE = Number(PAGE_SIZE_OPTIONS[0]);

export const ListPagination = ({ pagination, limit, onPageChange, onLimitChange }) => {
  if (!pagination || pagination.total <= MIN_ROWS_TO_PAGINATE) {
    return null;
  }

  const { page, total, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Text size="sm" c="dimmed">
        {start}–{end} of {total}
      </Text>
      <Group gap="sm" wrap="nowrap">
        <Select
          data={PAGE_SIZE_OPTIONS}
          value={String(limit)}
          onChange={(value) => onLimitChange(Number(value))}
          w={92}
          size="sm"
          allowDeselect={false}
          aria-label="Rows per page"
        />
        <Pagination
          value={page}
          total={totalPages}
          onChange={onPageChange}
          size="sm"
          withEdges
        />
      </Group>
    </Group>
  );
};
