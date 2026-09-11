import { Fragment, useMemo, useState } from 'react';
import { Card, Divider, Group, Paper, Stack, Table, Text, TextInput } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';

const groupByClient = (jobs) => {
  const clients = new Map();

  (jobs || []).forEach((job) => {
    const key = job.clientName || 'Unknown client';
    if (!clients.has(key)) {
      clients.set(key, { clientName: key, entryCount: 0, billableHours: 0, paidHours: 0, jobs: [] });
    }
    const record = clients.get(key);
    record.entryCount += job.entryCount;
    record.billableHours += job.billableHours;
    record.paidHours += job.paidHours;
    record.jobs.push(job);
  });

  return [...clients.values()].map((client) => ({
    ...client,
    billableHours: Math.round(client.billableHours * 100) / 100,
    paidHours: Math.round(client.paidHours * 100) / 100
  }));
};

export const ClientHoursTable = ({ jobs, totals }) => {
  const [expanded, setExpanded] = useState(() => new Set());
  const rows = useMemo(() => groupByClient(jobs), [jobs]);
  const table = useClientTable(rows, {
    searchFields: ['clientName'],
    defaultSort: 'clientName',
    defaultOrder: 'asc'
  });

  const toggle = (name) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>Hours by client</Text>
          <TextInput
            placeholder="Search client"
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={{ base: '100%', sm: 260 }}
          />
        </Group>

        <Stack gap="xs" hiddenFrom="lg">
          {table.data.length ? (
            table.data.map((client) => {
              const isOpen = expanded.has(client.clientName);
              return (
                <Paper key={client.clientName} withBorder radius="md" p="sm">
                  <Stack gap={8}>
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      align="flex-start"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggle(client.clientName)}
                    >
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <NavIcon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
                        <Text fw={600} size="sm" truncate>
                          {client.clientName}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                        {client.jobs.length} job{client.jobs.length === 1 ? '' : 's'}
                      </Text>
                    </Group>
                    <Group gap="lg">
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">
                          Billable
                        </Text>
                        <Text size="sm" fw={600}>
                          {client.billableHours}
                        </Text>
                      </Stack>
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed">
                          Paid
                        </Text>
                        <Text size="sm" fw={700} c="brand.7">
                          {client.paidHours}
                        </Text>
                      </Stack>
                    </Group>
                    {isOpen ? (
                      <>
                        <Divider />
                        <Stack gap={8}>
                          {client.jobs.map((job) => (
                            <Stack key={job.jobId} gap={2}>
                              <Group justify="space-between" wrap="nowrap">
                                <Text size="xs" fw={600}>
                                  {job.jobNumber || '—'}
                                </Text>
                                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                  {job.entryCount} shift{job.entryCount === 1 ? '' : 's'}
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {job.billableHours}h billable · {job.paidHours}h paid
                              </Text>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    ) : null}
                  </Stack>
                </Paper>
              );
            })
          ) : (
            <Text c="dimmed" ta="center" py="md" size="sm">
              No submitted entries in this period
            </Text>
          )}
          {totals ? (
            <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-brand-0)">
              <Group justify="space-between">
                <Text fw={700} size="sm">
                  Total
                </Text>
                <Text fw={700} size="sm">
                  {totals.billableHours}h billable · {totals.paidHours}h paid
                </Text>
              </Group>
            </Paper>
          ) : null}
        </Stack>

        <Table.ScrollContainer minWidth={620} visibleFrom="lg">
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                <SortableTh field="clientName" label="Client" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <Table.Th>Jobs</Table.Th>
                <SortableTh field="billableHours" label="Billable hours" sort={table.sort} order={table.order} onSort={table.toggleSort} />
                <SortableTh field="paidHours" label="Paid hours" sort={table.sort} order={table.order} onSort={table.toggleSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((client) => {
                  const isOpen = expanded.has(client.clientName);
                  return (
                    <Fragment key={client.clientName}>
                      <Table.Tr
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggle(client.clientName)}
                      >
                        <Table.Td style={{ width: 32 }}>
                          <NavIcon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
                        </Table.Td>
                        <Table.Td>{client.clientName}</Table.Td>
                        <Table.Td>{client.jobs.length}</Table.Td>
                        <Table.Td>{client.billableHours}</Table.Td>
                        <Table.Td fw={600}>{client.paidHours}</Table.Td>
                      </Table.Tr>
                      {isOpen ? (
                        <Table.Tr key={`${client.clientName}-detail`}>
                          <Table.Td
                            colSpan={5}
                            style={{ background: 'var(--mantine-color-gray-0)' }}
                          >
                            <Table verticalSpacing={4} fz="sm">
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Job #</Table.Th>
                                  <Table.Th>Shifts</Table.Th>
                                  <Table.Th>Billable hours</Table.Th>
                                  <Table.Th>Paid hours</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {client.jobs.map((job) => (
                                  <Table.Tr key={job.jobId}>
                                    <Table.Td>{job.jobNumber || '—'}</Table.Td>
                                    <Table.Td>{job.entryCount}</Table.Td>
                                    <Table.Td>{job.billableHours}</Table.Td>
                                    <Table.Td>{job.paidHours}</Table.Td>
                                  </Table.Tr>
                                ))}
                              </Table.Tbody>
                            </Table>
                          </Table.Td>
                        </Table.Tr>
                      ) : null}
                    </Fragment>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" py="md">
                      No submitted entries in this period
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
            {totals ? (
              <Table.Tfoot>
                <Table.Tr>
                  <Table.Th />
                  <Table.Th>Total</Table.Th>
                  <Table.Th />
                  <Table.Th>{totals.billableHours}</Table.Th>
                  <Table.Th>{totals.paidHours}</Table.Th>
                </Table.Tr>
              </Table.Tfoot>
            ) : null}
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
