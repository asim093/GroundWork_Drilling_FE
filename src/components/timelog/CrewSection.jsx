import { Checkbox, Stack, Table, Text } from '@mantine/core';
import { TimePicker } from '@mantine/dates';

export const CrewSection = ({ crew = [], onChange, roster = [], disabled }) => {
  const byId = new Map(crew.map((member) => [member.employeeId, member]));

  const toggle = (employeeId) => {
    if (byId.has(employeeId)) {
      onChange(crew.filter((member) => member.employeeId !== employeeId));
    } else {
      onChange([...crew, { employeeId, timeIn: '', timeOut: '' }]);
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
      <Table.ScrollContainer minWidth={560}>
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
            {roster.map((employee) => {
              const member = byId.get(employee.id);
              const active = Boolean(member);
              return (
                <Table.Tr key={employee.id}>
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
                  <Table.Td>
                    <TimePicker
                      value={member?.timeIn || ''}
                      format="12h"
                      withDropdown
                      clearable
                      disabled={disabled || !active}
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
                      disabled={disabled || !active}
                      onChange={(value) => setTime(employee.id, 'timeOut', value)}
                      aria-label={`${employee.name} time out`}
                      w={130}
                    />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
};
