import { useEffect, useState } from 'react';
import { Button, Group, Modal, MultiSelect, Stack, Text } from '@mantine/core';
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={job ? `Assign operators — ${job.jobNumber}` : 'Assign operators'}
      centered
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
          nothingFoundMessage="No operators found"
        />
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
