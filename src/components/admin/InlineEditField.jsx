import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Group, Loader, Select, Text, TextInput, UnstyledButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { NavIcon } from '../NavIcon.jsx';

const IDLE_STYLE = {
  borderBottom: '1px dashed var(--mantine-color-gray-4)',
  cursor: 'pointer',
  textAlign: 'left'
};

export const InlineEditField = ({
  value,
  onSave,
  type = 'text',
  data = [],
  label,
  placeholder = '—',
  required = false,
  display,
  readOnly = false
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }
  }, [editing]);

  const shown = display ? display(value) : value || <Text span c="dimmed">{placeholder}</Text>;

  if (readOnly) {
    return <Text size="sm" component="span">{shown}</Text>;
  }

  const commit = async (next) => {
    const clean = typeof next === 'string' ? next.trim() : next;

    if (required && !clean) {
      setDraft(value ?? '');
      setEditing(false);
      return;
    }
    if (clean === (value ?? '')) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(clean);
      setEditing(false);
    } catch {
      setDraft(value ?? '');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <UnstyledButton onClick={() => setEditing(true)} aria-label={`Edit ${label}`} style={IDLE_STYLE}>
        <Text size="sm" component="span">
          {shown}
        </Text>
      </UnstyledButton>
    );
  }

  if (type === 'select') {
    return (
      <Group gap={6} wrap="nowrap" align="center">
        <Select
          ref={inputRef}
          data={data}
          value={draft || null}
          onChange={(next) => commit(next || '')}
          onKeyDown={(event) => event.key === 'Escape' && cancel()}
          onBlur={cancel}
          size="sm"
          w={200}
          allowDeselect={false}
          searchable
        />
        {saving ? <Loader size="xs" /> : null}
      </Group>
    );
  }

  if (type === 'date') {
    return (
      <Group gap={6} wrap="nowrap" align="center">
        <DatePickerInput
          ref={inputRef}
          value={draft || null}
          onChange={(next) => commit(next || '')}
          onKeyDown={(event) => event.key === 'Escape' && cancel()}
          valueFormat="DD MMM YYYY"
          size="sm"
          w={200}
          clearable
        />
        {saving ? <Loader size="xs" /> : null}
      </Group>
    );
  }

  return (
    <Group gap={6} wrap="nowrap" align="center">
      <TextInput
        ref={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit(draft);
          } else if (event.key === 'Escape') {
            cancel();
          }
        }}
        onBlur={() => commit(draft)}
        size="sm"
        w={200}
        disabled={saving}
      />
      {saving ? (
        <Loader size="xs" />
      ) : (
        <ActionIcon variant="subtle" size="sm" onMouseDown={() => commit(draft)} aria-label="Save">
          <NavIcon name="chevronRight" size={14} />
        </ActionIcon>
      )}
    </Group>
  );
};
