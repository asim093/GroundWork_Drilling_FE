import { useMemo, useState } from 'react';
import { ActionIcon, Box, Button, Group, Select, Stack, Text } from '@mantine/core';
import { SHIFT_OPTIONS } from '../../constants/employees.js';
import { NavIcon } from '../NavIcon.jsx';

const ROW_STYLE = {
  border: '1px solid var(--mantine-color-gray-3)',
  borderRadius: 8,
  padding: '6px 10px'
};

export const SiteManagerPicker = ({ value = [], onChange, operators = [] }) => {
  const [draftUser, setDraftUser] = useState(null);
  const [draftShift, setDraftShift] = useState('Day');

  const operatorById = useMemo(
    () => new Map(operators.map((operator) => [operator.id, operator])),
    [operators]
  );

  const operatorOptions = operators.map((operator) => ({
    value: operator.id,
    label: `${operator.name} (${operator.email})`
  }));

  const has = (userId, shift) =>
    value.some((entry) => entry.userId === userId && entry.shift === shift);

  const duplicate = Boolean(draftUser) && has(draftUser, draftShift);

  const add = () => {
    if (!draftUser || duplicate) {
      return;
    }
    onChange([...value, { userId: draftUser, shift: draftShift }]);
    setDraftUser(null);
  };

  const remove = (index) => onChange(value.filter((_, i) => i !== index));

  const changeShift = (index, shift) => {
    if (has(value[index].userId, shift)) {
      return;
    }
    onChange(value.map((entry, i) => (i === index ? { ...entry, shift } : entry)));
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        Managers
      </Text>
      <Group gap="sm" align="flex-end" wrap="wrap">
        <Select
          placeholder="Select a manager"
          data={operatorOptions}
          value={draftUser}
          onChange={setDraftUser}
          searchable
          clearable
          w={280}
        />
        <Select
          data={SHIFT_OPTIONS}
          value={draftShift}
          onChange={(next) => setDraftShift(next || 'Day')}
          allowDeselect={false}
          w={110}
        />
        <Button variant="light" onClick={add} disabled={!draftUser || duplicate}>
          Add
        </Button>
      </Group>
      {duplicate ? (
        <Text size="xs" c="red">
          That manager is already added for the {draftShift} shift.
        </Text>
      ) : null}
      {value.length ? (
        <Stack gap={6}>
          {value.map((entry, index) => {
            const operator = operatorById.get(entry.userId);
            return (
              <Group
                key={`${entry.userId}-${entry.shift}`}
                justify="space-between"
                wrap="nowrap"
                style={ROW_STYLE}
              >
                <Box style={{ minWidth: 0 }}>
                  <Text size="sm" truncate>
                    {operator?.name || 'Unknown user'}
                  </Text>
                  {operator?.email ? (
                    <Text size="xs" c="dimmed" truncate>
                      {operator.email}
                    </Text>
                  ) : null}
                </Box>
                <Group gap="xs" wrap="nowrap">
                  <Select
                    data={SHIFT_OPTIONS}
                    value={entry.shift}
                    onChange={(next) => changeShift(index, next || entry.shift)}
                    allowDeselect={false}
                    size="xs"
                    w={100}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => remove(index)}
                    aria-label="Remove manager"
                  >
                    <NavIcon name="trash" size={15} />
                  </ActionIcon>
                </Group>
              </Group>
            );
          })}
        </Stack>
      ) : (
        <Text size="xs" c="dimmed">
          No managers assigned yet.
        </Text>
      )}
    </Stack>
  );
};
