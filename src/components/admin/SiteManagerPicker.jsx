import { useMemo, useState } from 'react';
import {
  Checkbox,
  Group,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput
} from '@mantine/core';

const MAX = 2;
const OTHER = { Day: 'Night', Night: 'Day' };

const ROW_STYLE = (selected) => ({
  cursor: 'pointer',
  borderRadius: 6,
  padding: '8px 10px',
  background: selected ? 'var(--mantine-color-brand-0)' : 'transparent'
});

export const SiteManagerPicker = ({ value = [], onChange, operators = [] }) => {
  const [search, setSearch] = useState('');

  const shiftByUser = useMemo(
    () => new Map(value.map((entry) => [entry.userId, entry.shift])),
    [value]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return operators
      .filter(
        (operator) =>
          !term ||
          operator.name.toLowerCase().includes(term) ||
          (operator.email || '').toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const rank = (id) => (shiftByUser.has(id) ? 0 : 1);
        return rank(a.id) - rank(b.id) || a.name.localeCompare(b.name);
      });
  }, [operators, search, shiftByUser]);

  const toggle = (userId) => {
    if (shiftByUser.has(userId)) {
      onChange(value.filter((entry) => entry.userId !== userId));
      return;
    }
    if (value.length >= MAX) {
      return;
    }
    const takenShift = value[0]?.shift;
    onChange([...value, { userId, shift: takenShift ? OTHER[takenShift] : 'Day' }]);
  };

  const setShift = (userId, shift) => {
    const other = value.find((entry) => entry.userId !== userId);
    onChange(
      value.map((entry) => {
        if (entry.userId === userId) {
          return { ...entry, shift };
        }
        if (other && entry.userId === other.userId) {
          return { ...entry, shift: OTHER[shift] };
        }
        return entry;
      })
    );
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          Shift managers
        </Text>
        <Text size="xs" c="dimmed">
          {value.length} / {MAX} selected
        </Text>
      </Group>
      <TextInput
        placeholder="Search manager"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <ScrollArea.Autosize
        mah={280}
        type="auto"
        style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
      >
        {visible.length ? (
          <Stack gap={0} p={4}>
            {visible.map((operator) => {
              const selectedShift = shiftByUser.get(operator.id);
              const isSelected = Boolean(selectedShift);
              const blocked = !isSelected && value.length >= MAX;
              return (
                <Group
                  key={operator.id}
                  wrap="nowrap"
                  gap="sm"
                  align="center"
                  onClick={() => !blocked && toggle(operator.id)}
                  style={{ ...ROW_STYLE(isSelected), opacity: blocked ? 0.45 : 1 }}
                >
                  <Checkbox checked={isSelected} readOnly tabIndex={-1} disabled={blocked} />
                  <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" truncate>
                      {operator.name}
                    </Text>
                    {operator.email ? (
                      <Text size="xs" c="dimmed" truncate>
                        {operator.email}
                      </Text>
                    ) : null}
                  </Stack>
                  {isSelected ? (
                    <SegmentedControl
                      size="xs"
                      data={['Day', 'Night']}
                      value={selectedShift}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(shift) => setShift(operator.id, shift)}
                    />
                  ) : null}
                </Group>
              );
            })}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="md">
            {operators.length ? 'No managers match your search' : 'No active managers available.'}
          </Text>
        )}
      </ScrollArea.Autosize>
      <Text size="xs" c="dimmed">
        Pick up to two managers; a job with a Day and a Night manager needs one on each shift.
      </Text>
    </Stack>
  );
};
