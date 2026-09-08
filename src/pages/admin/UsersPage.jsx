import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { EMPLOYEE_TYPE_OPTIONS } from '../../constants/employees.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
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

  const openNewOperator = useCallback(() => setModal({ open: true, user: null }), []);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNewOperator();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openNewOperator]);

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
        {user.employeeType ? (
          <Stack gap={0}>
            <Text size="sm">{user.employeeType}</Text>
            {user.employeeCategory ? (
              <Text size="xs" c="dimmed">
                {user.employeeCategory}
              </Text>
            ) : null}
          </Stack>
        ) : (
          '—'
        )}
      </Table.Td>
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
          <Button
            size="xs"
            variant="subtle"
            loading={busyId === user.id}
            onClick={() => handleResendInvite(user)}
          >
            {user.pendingInvite ? 'Resend invite' : 'Send reset link'}
          </Button>
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
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" align="center">
            <TextInput
              placeholder="Search name or email"
              value={filters.search || ''}
              onChange={(event) => setFilter('search', event.currentTarget.value)}
              w={340}
            />
            <Select
              placeholder="Any account"
              data={STATUS_FILTER_OPTIONS}
              value={filters.status || null}
              onChange={(value) => setFilter('status', value)}
              clearable
              w={170}
            />
            <Select
              placeholder="Any state"
              data={ACTIVE_FILTER_OPTIONS}
              value={filters.active || null}
              onChange={(value) => setFilter('active', value)}
              clearable
              w={150}
            />
            <Select
              placeholder="Any employee type"
              data={EMPLOYEE_TYPE_OPTIONS}
              value={filters.employeeType || null}
              onChange={(value) => setFilter('employeeType', value)}
              clearable
              w={200}
            />
            <Button
              ml="auto"
              leftSection={<NavIcon name="plus" size={16} />}
              onClick={openNewOperator}
            >
              New operator
            </Button>
          </Group>

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={940}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="email" label="Email" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Employee type</Table.Th>
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
                      <Table.Td colSpan={7}>
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
