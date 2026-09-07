import { useEffect, useState } from 'react';
import { Badge, Button, Group, Modal, MultiSelect, Stack, Text } from '@mantine/core';
import { setJobAssignments } from '../../services/jobService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

export const AssignUsersModal = ({ opened, onClose, job, operators, onSaved }) => {
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (opened && job) {
      setSelected((job.assignedUserIds || []).map((entry) => entry.id || entry));
    }
  }, [opened, job]);

  const options = operators.map((operator) => ({
    value: operator.id,
    label: `${operator.name} (${operator.email})`
  }));

  const handleSave = async () => {
    setSubmitting(true);

    try {
      await setJobAssignments(job.id, selected);
      notifySuccess('Assignments updated');
      onSaved();
      onClose();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update assignments'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOperators = selected
    .map((id) => operators.find((operator) => operator.id === id))
    .filter(Boolean);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={job ? `Assign operators — ${job.jobNumber}` : 'Assign operators'}
      centered
      size="lg"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Select the active operators responsible for this job.
        </Text>
        <MultiSelect
          data={options}
          value={selected}
          onChange={setSelected}
          placeholder={options.length ? 'Select operators' : 'No active operators available'}
          searchable
          clearable
          hidePickedOptions
          maxDropdownHeight={200}
          comboboxProps={{ withinPortal: false }}
          nothingFoundMessage="No operators found"
        />

        <Stack gap={6}>
          <Text size="xs" fw={600} c="dimmed">
            Assigned ({selectedOperators.length})
          </Text>
          {selectedOperators.length ? (
            <Group gap={6} wrap="wrap">
              {selectedOperators.map((operator) => (
                <Badge
                  key={operator.id}
                  variant="light"
                  rightSection={
                    <Text
                      component="span"
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setSelected((prev) => prev.filter((id) => id !== operator.id))
                      }
                    >
                      ×
                    </Text>
                  }
                >
                  {operator.name}
                </Badge>
              ))}
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              No operators assigned yet.
            </Text>
          )}
        </Stack>

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={submitting}>
            Save assignments
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
