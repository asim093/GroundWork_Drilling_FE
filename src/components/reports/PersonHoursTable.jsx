import { Fragment, useMemo, useState } from 'react';
import { Card, Divider, Group, Paper, Stack, Table, Text, TextInput } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { useClientTable } from '../../hooks/useClientTable.js';
import { formatDate } from '../../lib/dateRange.js';

/** Renders either the employee list (with employeeType + daily drill-down) or the manager list (no type column). */
export const PersonHoursTable = ({ people, title, personLabel = 'Employee', showType = true }) => {
  const [expanded, setExpanded] = useState(() => new Set());
  const rows = useMemo(() => people || [], [people]);
  const key = showType ? 'employeeId' : 'userId';

  const table = useClientTable(rows, {
    searchFields: ['name'],
    defaultSort: 'name',
    defaultOrder: 'asc'
  });

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const colSpan = showType ? 5 : 4;

  return (
    <Card withBorder radius="lg" p="lg">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text fw={700}>{title}</Text>
          <TextInput
            placeholder={`Search ${personLabel.toLowerCase()}`}
            value={table.search}
            onChange={(event) => table.setSearch(event.currentTarget.value)}
            w={{ base: '100%', sm: 240 }}
          />
        </Group>

        <Stack gap="xs" hiddenFrom="lg">
          {table.data.length ? (
            table.data.map((person) => {
              const id = person[key];
              const isOpen = expanded.has(id);
              return (
                <Paper key={id} withBorder radius="md" p="sm">
                  <Stack gap={8}>
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      align="flex-start"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggle(id)}
                    >
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <NavIcon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
                        <Stack gap={0} style={{ minWidth: 0 }}>
                          <Text fw={600} size="sm" truncate>
                            {person.name}
                          </Text>
                          {showType && person.employeeType ? (
                            <Text size="xs" c="dimmed">
                              {person.employeeType}
                            </Text>
                          ) : null}
                        </Stack>
                      </Group>
                      <Stack gap={0} align="flex-end" style={{ flexShrink: 0 }}>
                        <Text size="sm" fw={700} c="brand.7">
                          {person.totalHours}h
                        </Text>
                        <Text size="xs" c="dimmed">
                          {person.days.length} day{person.days.length === 1 ? '' : 's'}
                        </Text>
                      </Stack>
                    </Group>
                    {isOpen ? (
                      <>
                        <Divider />
                        <Stack gap={8}>
                          {person.days.map((day, index) => (
                            <Stack key={index} gap={2}>
                              <Group justify="space-between" wrap="nowrap">
                                <Text size="xs" fw={600}>
                                  {formatDate(day.date)}
                                </Text>
                                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                                  {day.hours}h
                                </Text>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {day.jobNumber || '—'} · {day.timeIn || '—'}–{day.timeOut || '—'}
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
        </Stack>

        <Table.ScrollContainer minWidth={560} visibleFrom="lg">
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                <SortableTh field="name" label={personLabel} sort={table.sort} order={table.order} onSort={table.toggleSort} />
                {showType ? <Table.Th>Type</Table.Th> : null}
                <Table.Th>Days worked</Table.Th>
                <SortableTh field="totalHours" label="Paid hours" sort={table.sort} order={table.order} onSort={table.toggleSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {table.data.length ? (
                table.data.map((person) => {
                  const id = person[key];
                  const isOpen = expanded.has(id);
                  return (
                    <Fragment key={id}>
                      <Table.Tr
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggle(id)}
                      >
                        <Table.Td style={{ width: 32 }}>
                          <NavIcon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
                        </Table.Td>
                        <Table.Td>{person.name}</Table.Td>
                        {showType ? <Table.Td>{person.employeeType || '—'}</Table.Td> : null}
                        <Table.Td>{person.days.length}</Table.Td>
                        <Table.Td fw={600}>{person.totalHours}</Table.Td>
                      </Table.Tr>
                      {isOpen ? (
                        <Table.Tr key={`${id}-detail`}>
                          <Table.Td colSpan={colSpan} style={{ background: 'var(--mantine-color-gray-0)' }}>
                            <Table verticalSpacing={4} fz="sm">
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th>Date</Table.Th>
                                  <Table.Th>Job #</Table.Th>
                                  <Table.Th>Client</Table.Th>
                                  <Table.Th>Time in</Table.Th>
                                  <Table.Th>Time out</Table.Th>
                                  <Table.Th>Hours</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {person.days.map((day, index) => (
                                  <Table.Tr key={index}>
                                    <Table.Td>{formatDate(day.date)}</Table.Td>
                                    <Table.Td>{day.jobNumber || '—'}</Table.Td>
                                    <Table.Td>{day.clientName || '—'}</Table.Td>
                                    <Table.Td>{day.timeIn || '—'}</Table.Td>
                                    <Table.Td>{day.timeOut || '—'}</Table.Td>
                                    <Table.Td>{day.hours}</Table.Td>
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
