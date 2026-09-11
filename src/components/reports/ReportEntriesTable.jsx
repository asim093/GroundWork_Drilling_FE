import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';
import { formatDate } from '../../lib/dateRange.js';

export const ReportEntriesTable = ({
  entries,
  showManager = true,
  title = 'Submitted entries',
  entryHref
}) => {
  const searchFields = useMemo(
    () => (showManager ? ['jobNumber', 'manager'] : ['jobNumber']),
    [showManager]
  );
  const navigate = useNavigate();
  const rows = useMemo(
    () =>
      (entries || []).map((entry) => ({
        entryId: entry.entryId,
        date: entry.date,
        jobNumber: entry.jobNumber || '—',
        clientName: entry.clientName || '—',
        manager: entry.manager || '—',
        timeIn: entry.timeIn || '—',
        timeOut: entry.timeOut || '—',
        billableHours: entry.billableHours,
        paidHours: entry.paidHours
      })),
    [entries]
  );

  const table = useClientTable(rows, {
    searchFields,
    defaultSort: 'date',
    defaultOrder: 'desc'
  });

  const colSpan = showManager ? 8 : 7;

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>{title}</Text>
          <TextInput
            placeholder={showManager ? 'Search job # or manager' : 'Search job #'}
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={{ base: '100%', sm: 260 }}
          />
        </Group>

        <Table.ScrollContainer minWidth={showManager ? 760 : 640}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableTh field="date" label="Date" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="jobNumber" label="Job #" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <Table.Th>Client</Table.Th>
                {showManager ? (
                  <SortableTh field="manager" label="Manager" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                ) : null}
                <Table.Th>Time in / out</Table.Th>
                <SortableTh field="billableHours" label="Billable hrs" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="paidHours" label="Paid hrs" sort={table.sort} order={table.order} onSort={table.toggleSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((row) => (
                  <Table.Tr
                    key={row.entryId}
                    style={entryHref && row.entryId ? { cursor: 'pointer' } : undefined}
                    onClick={
                      entryHref && row.entryId ? () => navigate(entryHref(row.entryId)) : undefined
                    }
                  >
                    <Table.Td>{formatDate(row.date)}</Table.Td>
                    <Table.Td>{row.jobNumber}</Table.Td>
                    <Table.Td>{row.clientName}</Table.Td>
                    {showManager ? <Table.Td>{row.manager}</Table.Td> : null}
                    <Table.Td>
                      {row.timeIn} – {row.timeOut}
                    </Table.Td>
                    <Table.Td>{row.billableHours ?? '—'}</Table.Td>
                    <Table.Td>{row.paidHours ?? '—'}</Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={colSpan}>
                    <Text c="dimmed" ta="center" py="md">
                      No submitted entries in this period
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
