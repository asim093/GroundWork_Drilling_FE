import { Fragment, useMemo, useState } from 'react';
import { Card, Group, Stack, Table, Text, TextInput } from '@mantine/core';
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

        <Table.ScrollContainer minWidth={620}>
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
