import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { UserFormModal } from '../../components/admin/UserFormModal.jsx';
import { useListParams } from '../../hooks/useListParams.js';
import { listUsers, updateUser } from '../../services/userService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const ROLE_FILTER_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operator' }
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

export const UsersPage = () => {
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'createdAt', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, user: null });
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listUsers(queryParams);
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load users'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (user) => {
    setBusyId(user.id);

    try {
      await updateUser(user.id, { active: !user.active });
      notifySuccess(user.active ? 'User deactivated' : 'User activated');
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update user'));
    } finally {
      setBusyId(null);
    }
  };

  const rows = result.data.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.name}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>
        <Badge variant="light" tt="capitalize">
          {user.role}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={user.active ? 'green' : 'gray'}>
          {user.active ? 'Active' : 'Inactive'}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(user.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" justify="flex-end">
          <Button size="xs" variant="default" onClick={() => setModal({ open: true, user })}>
            Edit
          </Button>
          <Button
            size="xs"
            variant="light"
            color={user.active ? 'red' : 'green'}
            loading={busyId === user.id}
            onClick={() => handleToggleActive(user)}
          >
            {user.active ? 'Deactivate' : 'Activate'}
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Title order={3}>Users</Title>
        <Button onClick={() => setModal({ open: true, user: null })}>New user</Button>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap">
            <TextInput
              placeholder="Search name or email"
              value={filters.search || ''}
              onChange={(event) => setFilter('search', event.currentTarget.value)}
              w={220}
            />
            <Select
              placeholder="All roles"
              data={ROLE_FILTER_OPTIONS}
              value={filters.role || null}
              onChange={(value) => setFilter('role', value)}
              clearable
              w={150}
            />
            <Select
              placeholder="All statuses"
              data={ACTIVE_FILTER_OPTIONS}
              value={filters.active || null}
              onChange={(value) => setFilter('active', value)}
              clearable
              w={150}
            />
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={720}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="email" label="Email" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <SortableTh
                      field="createdAt"
                      label="Created"
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
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          No users match the current filters
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
      </Card>

      <UserFormModal
        opened={modal.open}
        user={modal.user}
        onClose={() => setModal({ open: false, user: null })}
        onSaved={load}
      />
    </Stack>
  );
};
