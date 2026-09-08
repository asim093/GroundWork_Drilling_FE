import { useState } from 'react';
import { Button, Divider, Popover, Stack, TextInput } from '@mantine/core';
import { NavIcon } from './NavIcon.jsx';

const pad = (value) => String(value).padStart(2, '0');
const iso = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const monthStart = (year, month) => new Date(Date.UTC(year, month, 1));
const monthEnd = (year, month) => new Date(Date.UTC(year, month + 1, 0));

const buildPresets = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  return [
    { label: 'This month', from: iso(monthStart(year, month)), to: iso(monthEnd(year, month)) },
    {
      label: 'Last month',
      from: iso(monthStart(year, month - 1)),
      to: iso(monthEnd(year, month - 1))
    },
    {
      label: 'Last 3 months',
      from: iso(monthStart(year, month - 2)),
      to: iso(monthEnd(year, month))
    },
    { label: 'Year to date', from: iso(monthStart(year, 0)), to: iso(now) }
  ];
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Any';

const EMPTY_RANGE = { from: '', to: '' };

export const DateRangePicker = ({ value, onChange, size, radius = 'sm' }) => {
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState(value || EMPTY_RANGE);
  const presets = buildPresets();
  const current = value || EMPTY_RANGE;

  const handleOpenChange = (next) => {
    setOpened(next);
    if (next) {
      setDraft(value || EMPTY_RANGE);
    }
  };

  const updateDraft = (field, next) => {
    setDraft((prev) => ({ ...(prev || EMPTY_RANGE), [field]: next }));
  };

  const applyPreset = (preset) => {
    onChange({ from: preset.from, to: preset.to });
    setOpened(false);
  };

  const applyCustom = () => {
    if (draft?.from && draft?.to) {
      onChange({ from: draft.from, to: draft.to });
      setOpened(false);
    }
  };

  return (
    <Popover
      opened={opened}
      onChange={handleOpenChange}
      position="bottom-start"
      shadow="md"
      withArrow
    >
      <Popover.Target>
        <Button
          variant="default"
          radius={radius}
          size={size}
          justify="space-between"
          rightSection={<NavIcon name="calendar" size={16} />}
          onClick={() => handleOpenChange(!opened)}
          miw={250}
        >
          {formatDate(current.from)} – {formatDate(current.to)}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs" w={250}>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="subtle"
              justify="flex-start"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
          <Divider label="Custom range" labelPosition="center" />
          <TextInput
            label="From"
            type="date"
            value={draft?.from || ''}
            onChange={(event) => updateDraft('from', event.currentTarget.value)}
          />
          <TextInput
            label="To"
            type="date"
            value={draft?.to || ''}
            onChange={(event) => updateDraft('to', event.currentTarget.value)}
          />
          <Button onClick={applyCustom} disabled={!draft?.from || !draft?.to}>
            Apply range
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
