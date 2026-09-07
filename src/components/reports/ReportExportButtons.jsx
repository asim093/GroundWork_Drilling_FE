import { useState } from 'react';
import { Button, Group } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

export const ReportExportButtons = ({ onExport, disabled, size = 'sm' }) => {
  const [busy, setBusy] = useState(null);

  const run = async (format) => {
    setBusy(format);

    try {
      await onExport(format);
      notifySuccess(`${format === 'pdf' ? 'PDF' : 'Excel'} report downloaded`);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to export the report'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Group gap="sm" wrap="nowrap">
      <Button
        size={size}
        variant="default"
        leftSection={<NavIcon name="reports" size={15} />}
        loading={busy === 'pdf'}
        disabled={disabled || busy !== null}
        onClick={() => run('pdf')}
      >
        PDF
      </Button>
      <Button
        size={size}
        variant="default"
        leftSection={<NavIcon name="reports" size={15} />}
        loading={busy === 'xlsx'}
        disabled={disabled || busy !== null}
        onClick={() => run('xlsx')}
      >
        Excel
      </Button>
    </Group>
  );
};
