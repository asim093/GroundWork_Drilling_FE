import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Center, Group, Loader, Stack } from '@mantine/core';
import { TimeLogEntryView } from '../../components/timelog/TimeLogEntryView.jsx';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { getTimeLog } from '../../services/timeLogService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError } from '../../lib/toast.js';

export const AdminTimeLogPage = () => {
  usePageTitle('Time log');
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setEntry(await getTimeLog(id));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to open the time log'));
      navigate('/admin/reports', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !entry) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group>
        <Button variant="subtle" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Group>
      <TimeLogEntryView entry={entry} />
    </Stack>
  );
};
