import { Badge, Box, Button, Divider, Group, Stack, Text } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';

const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const PersonPill = ({ name, tag, muted }) => (
  <Group
    gap={8}
    wrap="nowrap"
    style={{
      border: '1px solid var(--mantine-color-default-border)',
      borderRadius: 999,
      padding: '3px 10px 3px 3px',
      background: muted ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-brand-0)'
    }}
  >
    <Box
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        background: 'var(--mantine-color-body)',
        border: '1px solid var(--mantine-color-default-border)'
      }}
    >
      {initials(name)}
    </Box>
    <Text size="sm" fw={500}>
      {name}
    </Text>
    {tag ? (
      <Badge size="xs" variant="light" color={muted ? 'gray' : 'brand'}>
        {tag}
      </Badge>
    ) : null}
  </Group>
);

const PeopleGroup = ({ label, people, emptyText, muted }) => (
  <Stack gap={6}>
    <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: 0.4 }}>
      {label} ({people.length})
    </Text>
    {people.length ? (
      <Group gap="xs" wrap="wrap">
        {people.map((person) => (
          <PersonPill key={person.key} name={person.name} tag={person.tag} muted={muted} />
        ))}
      </Group>
    ) : (
      <Text size="sm" c="dimmed">
        {emptyText}
      </Text>
    )}
  </Stack>
);

export const PeopleSummary = ({ siteManagers, rosterEmployeeIds, operators, employees, onManage }) => {
  const operatorById = new Map(operators.map((operator) => [operator.id, operator]));
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

  const managers = (siteManagers || []).map((entry, index) => {
    const id = entry.userId?.id || entry.userId;
    return {
      key: `${id}-${entry.shift}-${index}`,
      name: entry.userId?.name || operatorById.get(id)?.name || 'Unknown',
      tag: entry.shift
    };
  });

  const crew = (rosterEmployeeIds || []).map((entry) => {
    const id = entry.id || entry;
    const employee = employeeById.get(id);
    return {
      key: id,
      name: entry.name || employee?.name || 'Unknown',
      tag: entry.employeeType || employee?.employeeType || null
    };
  });

  const empty = !managers.length && !crew.length;

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text fw={700}>People on this job</Text>
        <Button
          variant="light"
          size="xs"
          leftSection={<NavIcon name="users" size={15} />}
          onClick={onManage}
        >
          {empty ? 'Assign managers & crew' : 'Manage people'}
        </Button>
      </Group>

      {empty ? (
        <Box
          onClick={onManage}
          style={{
            border: '1.5px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            padding: 'var(--mantine-spacing-lg)',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <Text size="sm" fw={500}>
            No managers or crew assigned yet
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Assign a Day / Night manager and pick the crew that can be logged against this job.
          </Text>
        </Box>
      ) : (
        <>
          <PeopleGroup
            label="Managers"
            people={managers}
            emptyText="No managers — this job is hidden from managers until one is assigned."
          />
          <Divider />
          <PeopleGroup label="Crew" people={crew} emptyText="No crew on the roster yet." muted />
        </>
      )}
    </Stack>
  );
};
