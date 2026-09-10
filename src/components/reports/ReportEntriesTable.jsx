import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { BonusBadge } from './BonusBadge.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';
import { formatDate } from '../../lib/dateRange.js';

export const ReportEntriesTable = ({
  entries,
  showOperator = true,
  title = 'Submitted entries',
  entryHref
}) => {
  const searchFields = useMemo(
    () => (showOperator ? ['jobNumber', 'operator'] : ['jobNumber']),
    [showOperator]
  );
  const navigate = useNavigate();
  const rows = useMemo(
    () =>
      (entries || []).map((entry) => ({
        entryId: entry.entryId,
        userId: entry.userId,
        date: entry.date,
        jobNumber: entry.jobNumber || '—',
        operator: entry.operator || '—',
        hours: entry.totalLoggedHours,
        drilled: entry.metersDrilled,
        recovered: entry.metersRecovered,
        recoveryPercent: entry.recoveryPercent,
        eligibility: entry.eligibility
      })),
    [entries]
  );

  const table = useClientTable(rows, {
    searchFields,
    defaultSort: 'date',
    defaultOrder: 'desc'
  });

  const colSpan = showOperator ? 8 : 7;

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>{title}</Text>
          <TextInput
            placeholder={showOperator ? 'Search job # or site manager' : 'Search job #'}
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={260}
          />
        </Group>

        <Table.ScrollContainer minWidth={showOperator ? 820 : 700}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableTh field="date" label="Date" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="jobNumber" label="Job #" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                {showOperator ? (
                  <SortableTh field="operator" label="Site manager" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                ) : null}
                <SortableTh field="hours" label="Hours" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="drilled" label="Drilled (m)" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="recovered" label="Recovered (m)" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="recoveryPercent" label="Recovery %" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="eligibility" label="Eligible" sort={table.sort} order={table.order} onSort={table.toggleSort} />
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
                    {showOperator ? <Table.Td>{row.operator}</Table.Td> : null}
                    <Table.Td>{row.hours ?? '—'}</Table.Td>
                    <Table.Td>{row.drilled ?? '—'}</Table.Td>
                    <Table.Td>{row.recovered ?? '—'}</Table.Td>
                    <Table.Td>
                      {row.recoveryPercent === null ? (
                        <Text c="dimmed" size="sm">
                          —
                        </Text>
                      ) : (
                        `${row.recoveryPercent}%`
                      )}
                    </Table.Td>
                    <Table.Td>
                      <BonusBadge eligibility={row.eligibility} size="sm" />
                    </Table.Td>
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
