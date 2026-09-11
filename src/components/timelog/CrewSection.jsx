import { useMemo } from 'react';
import { Checkbox, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
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
      <Stack gap="xs">
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
                  <SimpleGrid cols={2} spacing="xs">
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
    </Stack>
  );
};
