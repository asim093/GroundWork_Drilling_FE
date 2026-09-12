import { useMemo } from 'react';
import { Checkbox, Group, Paper, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import { TimePicker } from '@mantine/dates';

export const CrewSection = ({ crew = [], onChange, roster = [], disabled, shiftTimes }) => {
  const byId = useMemo(() => new Map(crew.map((member) => [member.employeeId, member])), [crew]);

  const orderedRoster = useMemo(() => {
    const rank = (id) => (byId.has(id) ? 0 : 1);
    return [...roster].sort(
      (a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name)
    );
  }, [roster, byId]);

  const toggle = (employeeId) => {
    if (byId.has(employeeId)) {
      onChange(crew.filter((member) => member.employeeId !== employeeId));
    } else {
      onChange([
        ...crew,
        {
          employeeId,
          timeIn: shiftTimes?.timeIn || '',
          timeOut: shiftTimes?.timeOut || ''
        }
      ]);
    }
  };

  const setTime = (employeeId, key, value) =>
    onChange(
      crew.map((member) =>
        member.employeeId === employeeId ? { ...member, [key]: value || '' } : member
      )
    );

  if (!roster.length) {
    return (
      <Text size="sm" c="dimmed">
        This job has no roster yet. Add employees to the job roster first.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        Tick each crew member who worked this shift and record their individual time in and out.
      </Text>

      <Stack gap="xs" hiddenFrom="lg">
        {orderedRoster.map((employee) => {
          const member = byId.get(employee.id);
          const active = Boolean(member);
          return (
            <Paper key={employee.id} withBorder radius="md" p="xs" style={active ? undefined : { opacity: 0.6 }}>
              <Stack gap={8}>
                <Group gap="sm" wrap="nowrap">
                  <Checkbox
                    checked={active}
                    disabled={disabled}
                    onChange={() => toggle(employee.id)}
                    aria-label={`${employee.name} worked this shift`}
                  />
                  <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} truncate>
                      {employee.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {employee.employeeType}
                    </Text>
                  </Stack>
                </Group>
                {active ? (
                  <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
                    <TimePicker
                      label="Time in"
                      size="sm"
                      value={member?.timeIn || ''}
                      format="12h"
                      withDropdown
                      clearable
                      disabled={disabled}
                      onChange={(value) => setTime(employee.id, 'timeIn', value)}
                      aria-label={`${employee.name} time in`}
                    />
                    <TimePicker
                      label="Time out"
                      size="sm"
                      value={member?.timeOut || ''}
                      format="12h"
                      withDropdown
                      clearable
                      disabled={disabled}
                      onChange={(value) => setTime(employee.id, 'timeOut', value)}
                      aria-label={`${employee.name} time out`}
                    />
                  </SimpleGrid>
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      <Table.ScrollContainer minWidth={480} visibleFrom="lg">
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 36 }} />
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Time in</Table.Th>
              <Table.Th>Time out</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orderedRoster.map((employee) => {
              const member = byId.get(employee.id);
              const active = Boolean(member);
              return (
                <Table.Tr key={employee.id} style={active ? undefined : { opacity: 0.55 }}>
                  <Table.Td>
                    <Checkbox
                      checked={active}
                      disabled={disabled}
                      onChange={() => toggle(employee.id)}
                      aria-label={`${employee.name} worked this shift`}
                    />
                  </Table.Td>
                  <Table.Td>{employee.name}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {employee.employeeType}
                    </Text>
                  </Table.Td>
                  {active ? (
                    <>
                      <Table.Td>
                        <TimePicker
                          value={member?.timeIn || ''}
                          format="12h"
                          withDropdown
                          clearable
                          disabled={disabled}
                          onChange={(value) => setTime(employee.id, 'timeIn', value)}
                          aria-label={`${employee.name} time in`}
                          w={130}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TimePicker
                          value={member?.timeOut || ''}
                          format="12h"
                          withDropdown
                          clearable
                          disabled={disabled}
                          onChange={(value) => setTime(employee.id, 'timeOut', value)}
                          aria-label={`${employee.name} time out`}
                          w={130}
                        />
                      </Table.Td>
                    </>
                  ) : (
                    <>
                      <Table.Td>
                        <Text c="dimmed">—</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">—</Text>
                      </Table.Td>
                    </>
                  )}
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
};
