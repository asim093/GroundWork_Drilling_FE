import { Fragment, useMemo, useState } from 'react';
import { Card, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { SortableTh } from '../list/SortableTh.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';

/**
 * Shared ledger UI for consumables (item -> qty used) and fuel (type -> litres).
 * `items` is an array of { key, label, total, jobs: [{jobId,label,qty}] }.
 */
export const LedgerReportTable = ({ items, title, itemColumnLabel, totalColumnLabel, emptyLabel }) => {
  const [expanded, setExpanded] = useState(() => new Set());
  const rows = useMemo(() => items || [], [items]);

  const table = useClientTable(rows, {
    searchFields: ['label'],
    defaultSort: 'total',
    defaultOrder: 'desc'
  });

  const toggle = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>{title}</Text>
          <TextInput
            placeholder="Search"
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={{ base: '100%', sm: 240 }}
          />
        </Group>

        <Table.ScrollContainer minWidth={480}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                <SortableTh field="label" label={itemColumnLabel} sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="total" label={totalColumnLabel} sort={table.sort} order={table.order} onSort={table.toggleSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((row) => {
                  const isOpen = expanded.has(row.key);
                  return (
                    <Fragment key={row.key}>
                      <Table.Tr style={{ cursor: 'pointer' }} onClick={() => toggle(row.key)}>
                        <Table.Td style={{ width: 32 }}>
                          <NavIcon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
                        </Table.Td>
                        <Table.Td>{row.label}</Table.Td>
                        <Table.Td fw={600}>{row.total}</Table.Td>
                      </Table.Tr>
                      {isOpen ? (
                        <Table.Tr key={`${row.key}-detail`}>
                          <Table.Td colSpan={3} style={{ background: 'var(--mantine-color-gray-0)' }}>
                            {row.jobs?.length ? (
                              <Table verticalSpacing={4} fz="sm">
                                <Table.Thead>
                                  <Table.Tr>
                                    <Table.Th>Job</Table.Th>
                                    <Table.Th>{totalColumnLabel}</Table.Th>
                                  </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                  {row.jobs.map((job) => (
                                    <Table.Tr key={job.jobId}>
                                      <Table.Td>{job.label}</Table.Td>
                                      <Table.Td>{job.qty}</Table.Td>
                                    </Table.Tr>
                                  ))}
                                </Table.Tbody>
                              </Table>
                            ) : (
                              <Text size="sm" c="dimmed">
                                No job breakdown available.
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text c="dimmed" ta="center" py="md">
                      {emptyLabel}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Card>
  );
};
