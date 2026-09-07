import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { useListParams } from '../../hooks/useListParams.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

export const MasterDataPanel = ({ service, singular, plural }) => {
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'name', order: 'asc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, record: null });
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setResult(await service.list(queryParams));
    } catch (error) {
      notifyError(extractErrorMessage(error, `Unable to load ${plural.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }, [service, plural, queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setName('');
    setModal({ open: true, record: null });
  };

  const openEdit = (record) => {
    setName(record.name);
    setModal({ open: true, record });
  };

  const closeModal = () => setModal({ open: false, record: null });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (modal.record) {
        await service.update(modal.record.id, { name: name.trim() });
        notifySuccess(`${singular} updated`);
      } else {
        await service.create({ name: name.trim() });
        notifySuccess(`${singular} added`);
      }

      closeModal();
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, `Unable to save ${singular.toLowerCase()}`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (record) => {
    setBusyId(record.id);

    try {
      if (record.active) {
        await service.deactivate(record.id);
        notifySuccess(`${singular} deactivated`);
      } else {
        await service.update(record.id, { active: true });
        notifySuccess(`${singular} reactivated`);
      }

      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, `Unable to update ${singular.toLowerCase()}`));
    } finally {
      setBusyId(null);
    }
  };

  const rows = result.data.map((record) => (
    <Table.Tr key={record.id}>
      <Table.Td>{record.name}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={record.active ? 'green' : 'gray'}>
          {record.active ? 'Active' : 'Inactive'}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(record.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" justify="flex-end">
          <Button size="xs" variant="default" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Button
            size="xs"
            variant="light"
            color={record.active ? 'red' : 'green'}
            loading={busyId === record.id}
            onClick={() => handleToggleActive(record)}
          >
            {record.active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="md">
        <Group gap="sm" wrap="wrap" align="flex-end">
          <TextInput
            label="Search"
            placeholder="Name"
            value={filters.search || ''}
            onChange={(event) => setFilter('search', event.currentTarget.value)}
            w={220}
          />
          <Select
            label="State"
            placeholder="Any"
            data={ACTIVE_FILTER_OPTIONS}
            value={filters.active || null}
            onChange={(value) => setFilter('active', value)}
            clearable
            w={140}
          />
          <Button ml="auto" onClick={openCreate}>
            New {singular.toLowerCase()}
          </Button>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={560}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                  <Table.Th>Status</Table.Th>
                  <SortableTh
                    field="createdAt"
                    label="Added"
                    sort={sort}
                    order={order}
                    onSort={toggleSort}
                  />
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed" ta="center" py="md">
                        No {plural.toLowerCase()} match the current filters
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        <ListPagination
          pagination={result.pagination}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </Stack>

      <Modal
        opened={modal.open}
        onClose={closeModal}
        title={modal.record ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}
        centered
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Name"
              required
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              data-autofocus
            />
            <Group justify="flex-end" gap="sm">
              <Button variant="default" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} disabled={!name.trim()}>
                {modal.record ? 'Save changes' : `Add ${singular.toLowerCase()}`}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Card>
  );
};
