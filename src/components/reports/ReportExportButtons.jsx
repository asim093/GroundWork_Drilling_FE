import { useState } from 'react';
import { Button, Menu } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

export const ReportExportButtons = ({ onExport, disabled, size = 'sm', radius = 'sm' }) => {
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
    <Menu position="bottom-end" shadow="md" radius={radius} width={180} disabled={disabled}>
      <Menu.Target>
        <Button
          size={size}
          radius={radius}
          variant="default"
          leftSection={<NavIcon name="download" size={15} />}
          rightSection={<NavIcon name="chevronDown" size={14} />}
          loading={busy !== null}
          disabled={disabled}
        >
          Export
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Download report</Menu.Label>
        <Menu.Item onClick={() => run('pdf')}>PDF document</Menu.Item>
        <Menu.Item onClick={() => run('xlsx')}>Excel spreadsheet</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
