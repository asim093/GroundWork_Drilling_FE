import { useMemo } from 'react';
import { Card, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';

const SEARCH_FIELDS = ['itemName'];

export const ConsumablesReportTable = ({ consumables }) => {
  const rows = useMemo(
    () => (consumables || []).map((item) => ({ itemName: item.itemName, qtyUsed: item.qtyUsed })),
    [consumables]
  );

  const table = useClientTable(rows, {
    searchFields: SEARCH_FIELDS,
    defaultSort: 'qtyUsed',
    defaultOrder: 'desc'
  });

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>Consumables used</Text>
          <TextInput
            placeholder="Search item"
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={240}
          />
        </Group>

        <Table.ScrollContainer minWidth={420}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableTh
                  field="itemName"
                  label="Item"
                  sort={table.sort}
                  order={table.order}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  field="qtyUsed"
                  label="Total qty used"
                  sort={table.sort}
                  order={table.order}
                  onSort={table.toggleSort}
                />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((row) => (
                  <Table.Tr key={row.itemName}>
                    <Table.Td>{row.itemName}</Table.Td>
                    <Table.Td>{row.qtyUsed}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={2}>
                    <Text c="dimmed" ta="center" py="md">
                      No consumables recorded in this period
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <ListPagination
          pagination={table.pagination}
          limit={table.limit}
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Stack>
    </Card>
  );
};
