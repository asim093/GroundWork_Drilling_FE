import { Group, Table, Text, UnstyledButton } from '@mantine/core';

export const SortableTh = ({ field, label, sort, order, onSort }) => {
  const active = sort === field;
  const indicator = active ? (order === 'asc' ? '↑' : '↓') : '↕';

  return (
    <Table.Th style={{ whiteSpace: 'nowrap' }}>
      <UnstyledButton onClick={() => onSort(field)} aria-label={`Sort by ${label}`}>
        <Group gap={6} wrap="nowrap">
          <Text size="sm" fw={600}>
            {label}
          </Text>
          <Text size="xs" c={active ? 'blue' : 'dimmed'}>
            {indicator}
          </Text>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
};
