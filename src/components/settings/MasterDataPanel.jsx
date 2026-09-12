import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { SortableTh } from '../list/SortableTh.jsx';
import { ListPagination } from '../list/ListPagination.jsx';
import { MobileFilterDrawer } from '../list/MobileFilterDrawer.jsx';
import { MobileSelect } from '../list/MobileSelect.jsx';
import { MobileFab } from '../list/MobileFab.jsx';
import { useListParams } from '../../hooks/useListParams.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

const countActive = (...values) => values.filter(Boolean).length;

export const MasterDataPanel = ({ service, singular, plural, extraColumn }) => {
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'createdAt', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null, distinct: {} });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, record: null });
  const [name, setName] = useState('');
  const [extraValue, setExtraValue] = useState('');
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

  const distinctOptions = useMemo(() => {
    if (!extraColumn?.distinctKey) {
      return [];
    }
    return (result.distinct?.[extraColumn.distinctKey] || []).map((value) => ({
      value,
      label: value
    }));
  }, [result.distinct, extraColumn]);

  const filterOptions = extraColumn?.filterOptions || distinctOptions;
  const fieldOptions = extraColumn?.fieldOptions || distinctOptions;

  const openCreate = useCallback(() => {
    setName('');
    setExtraValue('');
    setModal({ open: true, record: null });
  }, []);

  const openEdit = (record) => {
    setName(record.name);
    setExtraValue(extraColumn ? extraColumn.initialValue(record) : '');
    setModal({ open: true, record });
  };

  const closeModal = () => setModal({ open: false, record: null });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = { name: name.trim() };
    if (extraColumn) {
      payload[extraColumn.payloadKey] = extraValue || (extraColumn.kind === 'text' ? '' : null);
    }

    try {
      if (modal.record) {
        await service.update(modal.record.id, payload);
        notifySuccess(`${singular} updated`);
      } else {
        await service.create(payload);
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

  const colSpan = extraColumn ? 5 : 4;

  const filterFields = (
    <>
      {extraColumn ? (
        <MobileSelect
          label={extraColumn.label}
          placeholder={extraColumn.filterPlaceholder}
          data={filterOptions}
          value={filters[extraColumn.filterParam] || null}
          onChange={(value) => setFilter(extraColumn.filterParam, value)}
        />
      ) : null}
      <MobileSelect
        label="State"
        placeholder="Any state"
        data={ACTIVE_FILTER_OPTIONS}
        value={filters.active || null}
        onChange={(value) => setFilter('active', value)}
      />
    </>
  );

  const inlineFilterFields = (
    <>
      {extraColumn ? (
        <Select
          placeholder={extraColumn.filterPlaceholder}
          data={filterOptions}
          value={filters[extraColumn.filterParam] || null}
          onChange={(value) => setFilter(extraColumn.filterParam, value)}
          searchable
          clearable
          size="sm"
          radius="sm"
          miw={150}
        />
      ) : null}
      <Select
        placeholder="Any state"
        data={ACTIVE_FILTER_OPTIONS}
        value={filters.active || null}
        onChange={(value) => setFilter('active', value)}
        clearable
        size="sm"
        radius="sm"
        miw={120}
      />
    </>
  );

  const rows = result.data.map((record) => (
    <Table.Tr key={record.id}>
      <Table.Td>{record.name}</Table.Td>
      {extraColumn ? <Table.Td>{extraColumn.render(record)}</Table.Td> : null}
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
        <Group gap="sm" wrap="nowrap" align="center" hiddenFrom="lg">
          <TextInput
            placeholder={`Search ${plural.toLowerCase()}`}
            value={filters.search || ''}
            onChange={(event) => setFilter('search', event.currentTarget.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Group gap="xs" wrap="nowrap">
            <MobileFilterDrawer
              title={`Filter ${plural.toLowerCase()}`}
              activeCount={countActive(extraColumn ? filters[extraColumn.filterParam] : null, filters.active)}
            >
              {filterFields}
            </MobileFilterDrawer>
          </Group>
        </Group>

        <Group gap="sm" wrap="nowrap" align="center" justify="space-between" visibleFrom="lg">
          <Group gap="sm" wrap="nowrap" align="center" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
            <TextInput
              placeholder={`Search ${plural.toLowerCase()}`}
              value={filters.search || ''}
              onChange={(event) => setFilter('search', event.currentTarget.value)}
              style={{ flex: 0.5, minWidth: 0 }}
              size="sm"
              radius="sm"
            />
            {inlineFilterFields}
          </Group>
          <Button
            onClick={openCreate}
            style={{ flexShrink: 0 }}
            size="sm"
          >
            New {singular.toLowerCase()}
          </Button>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <>
            <Stack gap="xs" hiddenFrom="lg">
              {result.data.length ? (
                result.data.map((record) => (
                  <Paper key={record.id} withBorder radius="md" p="sm">
                    <Stack gap={6}>
                      <Group justify="space-between" wrap="nowrap" align="flex-start">
                        <Text fw={600} size="sm" truncate>
                          {record.name}
                        </Text>
                        <Badge variant="light" color={record.active ? 'green' : 'gray'} size="sm">
                          {record.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Group>
                      {extraColumn ? (
                        <Text size="xs" c="dimmed">
                          {extraColumn.render(record)}
                        </Text>
                      ) : null}
                      <Group gap="xs" wrap="wrap">
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
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Text c="dimmed" ta="center" py="md" size="sm">
                  No {plural.toLowerCase()} match the current filters
                </Text>
              )}
            </Stack>

            <Table.ScrollContainer minWidth={extraColumn ? 680 : 560} visibleFrom="lg">
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                    {extraColumn ? <Table.Th>{extraColumn.label}</Table.Th> : null}
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
                      <Table.Td colSpan={colSpan}>
                        <Text c="dimmed" ta="center" py="md">
                          No {plural.toLowerCase()} match the current filters
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </>
        )}

        <ListPagination
          pagination={result.pagination}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </Stack>

      <MobileFab onClick={openCreate} label={`New ${singular.toLowerCase()}`} />

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
            {extraColumn && extraColumn.kind === 'select' ? (
              <Select
                label={extraColumn.label}
                data={fieldOptions}
                value={extraValue || null}
                onChange={(value) => setExtraValue(value || '')}
                required={extraColumn.required}
                searchable
              />
            ) : null}
            {extraColumn && extraColumn.kind === 'text' ? (
              <Autocomplete
                label={extraColumn.label}
                data={fieldOptions.map((option) => option.value)}
                value={extraValue}
                onChange={setExtraValue}
              />
            ) : null}
            <Group justify="flex-end" gap="sm" wrap="nowrap">
              <Button variant="default" type="button" onClick={closeModal} size="sm">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                size="sm"
                disabled={
                  !name.trim() || (extraColumn?.required && extraColumn.kind === 'select' && !extraValue)
                }
              >
                {modal.record ? 'Save changes' : `Add ${singular.toLowerCase()}`}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Card>
  );
};
