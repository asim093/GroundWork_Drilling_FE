import { useMemo, useState } from 'react';
import { Badge, Checkbox, Group, ScrollArea, Select, Stack, Text, TextInput } from '@mantine/core';
import { EMPLOYEE_TYPE_OPTIONS } from '../../constants/employees.js';

export const RosterPicker = ({ value = [], onChange, employees = [] }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees
      .filter(
        (employee) =>
          (!term || employee.name.toLowerCase().includes(term)) &&
          (!typeFilter || employee.employeeType === typeFilter)
      )
      .sort((a, b) => {
        const rank = (id) => (selectedSet.has(id) ? 0 : 1);
        return rank(a.id) - rank(b.id) || a.name.localeCompare(b.name);
      });
  }, [employees, search, typeFilter, selectedSet]);

  const toggle = (id) =>
    onChange(selectedSet.has(id) ? value.filter((entry) => entry !== id) : [...value, id]);

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          Job roster
        </Text>
        <Text size="xs" c="dimmed">
          {value.length} selected
        </Text>
      </Group>
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Search name"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          w={220}
        />
        <Select
          placeholder="Any employee type"
          data={EMPLOYEE_TYPE_OPTIONS}
          value={typeFilter}
          onChange={setTypeFilter}
          clearable
          w={200}
        />
      </Group>
      <ScrollArea.Autosize
        mah={260}
        type="auto"
        style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
      >
        {visible.length ? (
          <Stack gap={0} p={4}>
            {visible.map((employee) => {
              const checked = selectedSet.has(employee.id);
              return (
                <Group
                  key={employee.id}
                  wrap="nowrap"
                  gap="sm"
                  onClick={() => toggle(employee.id)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    padding: '6px 8px',
                    background: checked ? 'var(--mantine-color-brand-0)' : 'transparent'
                  }}
                >
                  <Checkbox checked={checked} readOnly tabIndex={-1} />
                  <Text size="sm" style={{ flex: 1, minWidth: 0 }} truncate>
                    {employee.name}
                  </Text>
                  <Badge variant="light" color="gray" size="sm">
                    {employee.employeeType}
                  </Badge>
                </Group>
              );
            })}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="md">
            {employees.length
              ? 'No employees match your search'
              : 'No active employees — add some on the Employees page.'}
          </Text>
        )}
      </ScrollArea.Autosize>
    </Stack>
  );
};
