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
  TextInput
} from '@mantine/core';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { UserFormModal } from '../../components/admin/UserFormModal.jsx';
import { useListParams } from '../../hooks/useListParams.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { listUsers, updateUser, resendInvite } from '../../services/userService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Password set' },
  { value: 'pending', label: 'Pending invite' }
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

export const UsersPage = () => {
  usePageTitle('Operators');
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
      notifyError(extractErrorMessage(error, 'Unable to load operators'));
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
      notifySuccess(user.active ? 'Operator deactivated' : 'Operator activated');
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update operator'));
    } finally {
      setBusyId(null);
    }
  };

  const handleResendInvite = async (user) => {
    setBusyId(user.id);

    try {
      const { invite } = await resendInvite(user.id);
      notifySuccess(
        invite.delivered
          ? `Invitation re-sent to ${user.email}`
          : 'A fresh invite link was generated (email not configured)'
      );
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to resend the invite'));
    } finally {
      setBusyId(null);
    }
  };

  const rows = result.data.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.name}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>{user.phone || '—'}</Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <Badge variant="light" color={user.active ? 'green' : 'gray'}>
            {user.active ? 'Active' : 'Inactive'}
          </Badge>
          {user.pendingInvite ? (
            <Badge variant="outline" color="orange">
              Pending invite
            </Badge>
          ) : null}
        </Group>
      </Table.Td>
      <Table.Td>{new Date(user.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" justify="flex-end">
          <Button size="xs" variant="default" onClick={() => setModal({ open: true, user })}>
            Edit
          </Button>
          <Button
            size="xs"
            variant="subtle"
            loading={busyId === user.id}
            onClick={() => handleResendInvite(user)}
          >
            {user.pendingInvite ? 'Resend invite' : 'Send reset link'}
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
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" align="flex-end">
            <TextInput
              label="Search"
              placeholder="Name or email"
              value={filters.search || ''}
              onChange={(event) => setFilter('search', event.currentTarget.value)}
              w={220}
            />
            <Select
              label="Account"
              placeholder="Any"
              data={STATUS_FILTER_OPTIONS}
              value={filters.status || null}
              onChange={(value) => setFilter('status', value)}
              clearable
              w={160}
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
            <Button ml="auto" onClick={() => setModal({ open: true, user: null })}>
              New operator
            </Button>
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={820}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="email" label="Email" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Phone</Table.Th>
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
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" ta="center" py="md">
                          No operators match the current filters
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
