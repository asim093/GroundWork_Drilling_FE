import { Fragment, useMemo, useState } from 'react';
import { Card, Divider, Group, Paper, Stack, Table, Text, TextInput } from '@mantine/core';
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

        <Stack gap="xs" hiddenFrom="lg">
          {table.data.length ? (
            table.data.map((row) => {
              const isOpen = expanded.has(row.key);
              return (
                <Paper key={row.key} withBorder radius="md" p="sm">
                  <Stack gap={8}>
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggle(row.key)}
                    >
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <NavIcon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
                        <Text fw={600} size="sm" truncate>
                          {row.label}
                        </Text>
                      </Group>
                      <Text fw={700} size="sm" c="brand.7" style={{ flexShrink: 0 }}>
                        {row.total}
                      </Text>
                    </Group>
                    {isOpen ? (
                      <>
                        <Divider />
                        {row.jobs?.length ? (
                          <Stack gap={6}>
                            {row.jobs.map((job) => (
                              <Group key={job.jobId} justify="space-between" wrap="wrap">
                                <Text size="xs">{job.label}</Text>
                                <Text size="xs" c="dimmed">
                                  {job.qty}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        ) : (
                          <Text size="xs" c="dimmed">
                            No job breakdown available.
                          </Text>
                        )}
                      </>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })
          ) : (
            <Text c="dimmed" ta="center" py="md" size="sm">
              {emptyLabel}
            </Text>
          )}
        </Stack>

        <Table.ScrollContainer minWidth={480} visibleFrom="lg">
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
