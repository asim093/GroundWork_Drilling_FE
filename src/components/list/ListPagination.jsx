import { ActionIcon, Group, Pagination, Select, Text } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';

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
      <Group gap="sm" wrap="nowrap">
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {start}–{end} of {total}
        </Text>
        <Select
          data={PAGE_SIZE_OPTIONS}
          value={String(limit)}
          onChange={(value) => onLimitChange(Number(value))}
          w={80}
          size="sm"
          allowDeselect={false}
          aria-label="Rows per page"
          visibleFrom="xs"
        />
      </Group>

      <Group gap={6} wrap="nowrap" hiddenFrom="xs">
        <ActionIcon
          variant="default"
          size="md"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <NavIcon name="chevronLeft" size={15} />
        </ActionIcon>
        <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
          Page {page} of {totalPages}
        </Text>
        <ActionIcon
          variant="default"
          size="md"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <NavIcon name="chevronRight" size={15} />
        </ActionIcon>
      </Group>

      <Pagination value={page} total={totalPages} onChange={onPageChange} size="sm" withEdges visibleFrom="xs" />
    </Group>
  );
};
