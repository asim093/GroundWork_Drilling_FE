import { useMemo } from 'react';
import { Card, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';

const SEARCH_FIELDS = ['label', 'employeeType'];

const bonusLabel = (bonus) => {
  if (!bonus || typeof bonus.amount !== 'number' || !bonus.band) {
    return bonus?.note || 'Not available';
  }
  const detail =
    bonus.rateType === 'flat'
      ? `flat · ${bonus.band.fromMeters}–${bonus.band.toMeters} m`
      : `$${bonus.rate}/m · ${bonus.band.fromMeters}–${bonus.band.toMeters} m`;
  return `${detail}${bonus.aboveTopBand ? ' · above top band' : ''}`;
};

export const ReportGroupsTable = ({ groups, groupBy, onSelectUser }) => {
  const isUser = groupBy === 'user';

  const rows = useMemo(
    () =>
      (groups || []).map((group) => ({
        key: group.key,
        label: group.label,
        employeeType: group.employeeType || '—',
        entries: group.entryCount,
        hours: group.totals.totalLoggedHours,
        drilled: group.totals.metersDrilled,
        recovered: group.totals.metersRecovered,
        eligible: group.bonusEligibility.eligible,
        notEligible: group.bonusEligibility['not-eligible'],
        notAvailable: group.bonusEligibility['not-available'],
        eligibleMeters: group.bonus?.eligibleMeters ?? 0,
        bonusAmount: typeof group.bonus?.amount === 'number' ? group.bonus.amount : null,
        bonusDetail: bonusLabel(group.bonus),
        raw: group
      })),
    [groups]
  );

  const table = useClientTable(rows, {
    searchFields: SEARCH_FIELDS,
    defaultSort: 'label',
    defaultOrder: 'asc'
  });

  const th = (field, label) => (
    <SortableTh
      field={field}
      label={label}
      sort={table.sort}
      order={table.order}
      onSort={table.toggleSort}
    />
  );

  const colSpan = isUser ? 10 : 8;

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>{isUser ? 'Breakdown by user' : 'Breakdown by job'}</Text>
          <TextInput
            placeholder={isUser ? 'Search manager' : 'Search job'}
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={240}
          />
        </Group>
        {isUser ? (
          <Text size="xs" c="dimmed">
            Click a row to see that manager&apos;s detailed report.
          </Text>
        ) : null}

        <Table.ScrollContainer minWidth={isUser ? 1120 : 760}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {th('label', isUser ? 'Manager' : 'Job')}
                {isUser ? th('employeeType', 'Employee type') : null}
                {th('entries', 'Entries')}
                {th('hours', 'Hours')}
                {th('drilled', 'Drilled (m)')}
                {th('recovered', 'Recovered (m)')}
                {th('eligible', 'Eligible')}
                <Table.Th style={{ whiteSpace: 'nowrap' }}>Not eligible</Table.Th>
                <Table.Th style={{ whiteSpace: 'nowrap' }}>Not available</Table.Th>
                {isUser ? th('eligibleMeters', 'Eligible (m)') : null}
                {isUser ? th('bonusAmount', 'Bonus') : null}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((row) => (
                  <Table.Tr
                    key={row.key}
                    style={isUser ? { cursor: 'pointer' } : undefined}
                    onClick={isUser ? () => onSelectUser(row.raw) : undefined}
                  >
                    <Table.Td>{row.label}</Table.Td>
                    {isUser ? <Table.Td>{row.employeeType}</Table.Td> : null}
                    <Table.Td>{row.entries}</Table.Td>
                    <Table.Td>{row.hours}</Table.Td>
                    <Table.Td>{row.drilled}</Table.Td>
                    <Table.Td>{row.recovered}</Table.Td>
                    <Table.Td>{row.eligible}</Table.Td>
                    <Table.Td>{row.notEligible}</Table.Td>
                    <Table.Td>{row.notAvailable}</Table.Td>
                    {isUser ? <Table.Td>{row.eligibleMeters}</Table.Td> : null}
                    {isUser ? (
                      <Table.Td>
                        {row.bonusAmount !== null ? (
                          <Stack gap={0}>
                            <Text fw={600}>${row.bonusAmount}</Text>
                            <Text size="xs" c="dimmed">
                              {row.bonusDetail}
                            </Text>
                          </Stack>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {row.bonusDetail}
                          </Text>
                        )}
                      </Table.Td>
                    ) : null}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={colSpan}>
                    <Text c="dimmed" ta="center" py="md">
                      No data for this period
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
