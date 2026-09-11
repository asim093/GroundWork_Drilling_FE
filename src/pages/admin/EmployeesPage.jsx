import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput
} from '@mantine/core';
import { SortableTh } from '../../components/list/SortableTh.jsx';
import { ListPagination } from '../../components/list/ListPagination.jsx';
import { MobileFilterDrawer } from '../../components/list/MobileFilterDrawer.jsx';
import { UserFormModal } from '../../components/admin/UserFormModal.jsx';
import { EmployeeFormModal } from '../../components/admin/EmployeeFormModal.jsx';
import { useListParams } from '../../hooks/useListParams.js';
import {
  EMPLOYEE_CATEGORY_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
  MANAGER_TYPE_OPTIONS
} from '../../constants/employees.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { listUsers, updateUser, resendInvite } from '../../services/userService.js';
import { employeesService } from '../../services/masterDataService.js';
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

const countActive = (...values) => values.filter(Boolean).length;

const ManagerCard = ({ user, busy, onEdit, onToggleActive, onResendInvite }) => (
  <Paper withBorder radius="md" p="sm">
    <Stack gap={6}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>
            {user.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {user.email}
          </Text>
        </Stack>
        <Badge variant="light" color={user.active ? 'green' : 'gray'} size="sm">
          {user.active ? 'Active' : 'Inactive'}
        </Badge>
      </Group>
      <Group gap={6} wrap="wrap">
        {user.phone ? (
          <Text size="xs" c="dimmed">
            {user.phone}
          </Text>
        ) : null}
        {user.employeeType ? (
          <Badge variant="outline" color="gray" size="sm">
            {user.employeeType}
          </Badge>
        ) : null}
        {user.pendingInvite ? (
          <Badge variant="outline" color="orange" size="sm">
            Pending invite
          </Badge>
        ) : null}
      </Group>
      <Group gap="xs" wrap="wrap">
        <Button size="xs" variant="subtle" loading={busy} onClick={onResendInvite}>
          {user.pendingInvite ? 'Resend invite' : 'Send reset link'}
        </Button>
        <Button size="xs" variant="default" onClick={onEdit}>
          Edit
        </Button>
        <Button size="xs" variant="light" color={user.active ? 'red' : 'green'} loading={busy} onClick={onToggleActive}>
          {user.active ? 'Deactivate' : 'Activate'}
        </Button>
      </Group>
    </Stack>
  </Paper>
);

const ManagersTab = () => {
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'createdAt', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, user: null });
  const [busyId, setBusyId] = useState(null);

  const openNewManager = useCallback(() => setModal({ open: true, user: null }), []);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openNewManager();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openNewManager]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await listUsers(queryParams);
      setResult(response);
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load managers'));
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
      notifySuccess(user.active ? 'Manager deactivated' : 'Manager activated');
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update manager'));
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

  const filterFields = (
    <>
      <Select
        label="Account"
        placeholder="Any account"
        data={STATUS_FILTER_OPTIONS}
        value={filters.status || null}
        onChange={(value) => setFilter('status', value)}
        clearable
      />
      <Select
        label="State"
        placeholder="Any state"
        data={ACTIVE_FILTER_OPTIONS}
        value={filters.active || null}
        onChange={(value) => setFilter('active', value)}
        clearable
      />
      <Select
        label="Manager type"
        placeholder="Any manager type"
        data={MANAGER_TYPE_OPTIONS}
        value={filters.employeeType || null}
        onChange={(value) => setFilter('employeeType', value)}
        clearable
      />
    </>
  );

  const rows = result.data.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.name}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>{user.phone || '—'}</Table.Td>
      <Table.Td>{user.employeeType ? <Text size="sm">{user.employeeType}</Text> : '—'}</Table.Td>
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
    <Card withBorder radius="md" p="md">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="center">
          <TextInput
            placeholder="Search name or email"
            value={filters.search || ''}
            onChange={(event) => setFilter('search', event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Group gap="xs" wrap="nowrap" hiddenFrom="sm">
            <MobileFilterDrawer
              title="Filter managers"
              activeCount={countActive(filters.status, filters.active, filters.employeeType)}
            >
              {filterFields}
            </MobileFilterDrawer>
            <ActionIcon size="lg" radius="md" onClick={openNewManager} aria-label="New manager">
              <NavIcon name="plus" size={18} />
            </ActionIcon>
          </Group>
          <Button
            visibleFrom="sm"
            leftSection={<NavIcon name="plus" size={16} />}
            onClick={openNewManager}
            style={{ flexShrink: 0 }}
          >
            New manager
          </Button>
        </Group>

        <Group gap="sm" wrap="wrap" visibleFrom="sm">
          {filterFields}
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <>
            <Stack gap="xs" hiddenFrom="sm">
              {result.data.length ? (
                result.data.map((user) => (
                  <ManagerCard
                    key={user.id}
                    user={user}
                    busy={busyId === user.id}
                    onEdit={() => setModal({ open: true, user })}
                    onToggleActive={() => handleToggleActive(user)}
                    onResendInvite={() => handleResendInvite(user)}
                  />
                ))
              ) : (
                <Text c="dimmed" ta="center" py="md" size="sm">
                  No managers match the current filters
                </Text>
              )}
            </Stack>

            <Table.ScrollContainer minWidth={940} visibleFrom="sm">
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                    <SortableTh field="email" label="Email" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Employee type</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <SortableTh field="createdAt" label="Added" sort={sort} order={order} onSort={toggleSort} />
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
                          No managers match the current filters
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </>
        )}

        <ListPagination pagination={result.pagination} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </Stack>

      <UserFormModal
        opened={modal.open}
        user={modal.user}
        onClose={() => setModal({ open: false, user: null })}
        onSaved={load}
      />
    </Card>
  );
};

const CrewCard = ({ employee, busy, onEdit, onToggleActive }) => (
  <Paper withBorder radius="md" p="sm">
    <Stack gap={6}>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Text fw={600} size="sm" truncate>
          {employee.name}
        </Text>
        <Badge variant="light" color={employee.active ? 'green' : 'gray'} size="sm">
          {employee.active ? 'Active' : 'Inactive'}
        </Badge>
      </Group>
      <Group gap={6} wrap="wrap">
        {employee.phone ? (
          <Text size="xs" c="dimmed">
            {employee.phone}
          </Text>
        ) : null}
        <Badge variant="outline" color="gray" size="sm">
          {employee.employeeType || '—'}
        </Badge>
        {employee.employeeCategory ? (
          <Badge variant="outline" color="gray" size="sm">
            {employee.employeeCategory}
          </Badge>
        ) : null}
      </Group>
      <Group gap="xs" wrap="wrap">
        <Button size="xs" variant="default" onClick={onEdit}>
          Edit
        </Button>
        <Button size="xs" variant="light" color={employee.active ? 'red' : 'green'} loading={busy} onClick={onToggleActive}>
          {employee.active ? 'Deactivate' : 'Reactivate'}
        </Button>
      </Group>
    </Stack>
  </Paper>
);

const CrewTab = () => {
  const { queryParams, filters, sort, order, limit, setPage, setLimit, toggleSort, setFilter } =
    useListParams({ sort: 'createdAt', order: 'desc' });
  const [result, setResult] = useState({ data: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, employee: null });
  const [busyId, setBusyId] = useState(null);

  const openNewEmployee = useCallback(() => setModal({ open: true, employee: null }), []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setResult(await employeesService.list(queryParams));
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to load employees'));
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (employee) => {
    setBusyId(employee.id);

    try {
      if (employee.active) {
        await employeesService.deactivate(employee.id);
        notifySuccess('Employee deactivated');
      } else {
        await employeesService.update(employee.id, { active: true });
        notifySuccess('Employee reactivated');
      }
      load();
    } catch (error) {
      notifyError(extractErrorMessage(error, 'Unable to update employee'));
    } finally {
      setBusyId(null);
    }
  };

  const filterFields = (
    <>
      <Select
        label="Employee type"
        placeholder="Any employee type"
        data={EMPLOYEE_TYPE_OPTIONS}
        value={filters.employeeType || null}
        onChange={(value) => setFilter('employeeType', value)}
        clearable
      />
      <Select
        label="Category"
        placeholder="Any category"
        data={EMPLOYEE_CATEGORY_OPTIONS}
        value={filters.employeeCategory || null}
        onChange={(value) => setFilter('employeeCategory', value)}
        clearable
      />
      <Select
        label="State"
        placeholder="Any state"
        data={ACTIVE_FILTER_OPTIONS}
        value={filters.active || null}
        onChange={(value) => setFilter('active', value)}
        clearable
      />
    </>
  );

  const rows = result.data.map((employee) => (
    <Table.Tr key={employee.id}>
      <Table.Td>{employee.name}</Table.Td>
      <Table.Td>{employee.phone || '—'}</Table.Td>
      <Table.Td>{employee.employeeType || '—'}</Table.Td>
      <Table.Td>{employee.employeeCategory || '—'}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={employee.active ? 'green' : 'gray'}>
          {employee.active ? 'Active' : 'Inactive'}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(employee.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap" justify="flex-end">
          <Button size="xs" variant="default" onClick={() => setModal({ open: true, employee })}>
            Edit
          </Button>
          <Button
            size="xs"
            variant="light"
            color={employee.active ? 'red' : 'green'}
            loading={busyId === employee.id}
            onClick={() => handleToggleActive(employee)}
          >
            {employee.active ? 'Deactivate' : 'Reactivate'}
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="center">
          <TextInput
            placeholder="Search name"
            value={filters.search || ''}
            onChange={(event) => setFilter('search', event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Group gap="xs" wrap="nowrap" hiddenFrom="sm">
            <MobileFilterDrawer
              title="Filter employees"
              activeCount={countActive(filters.employeeType, filters.employeeCategory, filters.active)}
            >
              {filterFields}
            </MobileFilterDrawer>
            <ActionIcon size="lg" radius="md" onClick={openNewEmployee} aria-label="New employee">
              <NavIcon name="plus" size={18} />
            </ActionIcon>
          </Group>
          <Button
            visibleFrom="sm"
            leftSection={<NavIcon name="plus" size={16} />}
            onClick={openNewEmployee}
            style={{ flexShrink: 0 }}
          >
            New employee
          </Button>
        </Group>

        <Group gap="sm" wrap="wrap" visibleFrom="sm">
          {filterFields}
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <>
            <Stack gap="xs" hiddenFrom="sm">
              {result.data.length ? (
                result.data.map((employee) => (
                  <CrewCard
                    key={employee.id}
                    employee={employee}
                    busy={busyId === employee.id}
                    onEdit={() => setModal({ open: true, employee })}
                    onToggleActive={() => handleToggleActive(employee)}
                  />
                ))
              ) : (
                <Text c="dimmed" ta="center" py="md" size="sm">
                  No employees match the current filters
                </Text>
              )}
            </Stack>

            <Table.ScrollContainer minWidth={720} visibleFrom="sm">
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh field="name" label="Name" sort={sort} order={order} onSort={toggleSort} />
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>Employee type</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <SortableTh field="createdAt" label="Added" sort={sort} order={order} onSort={toggleSort} />
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
                          No employees match the current filters
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </>
        )}

        <ListPagination pagination={result.pagination} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      </Stack>

      <EmployeeFormModal
        opened={modal.open}
        employee={modal.employee}
        onClose={() => setModal({ open: false, employee: null })}
        onSaved={load}
      />
    </Card>
  );
};

export const EmployeesPage = () => {
  usePageTitle('Employees');

  return (
    <Stack gap="md">
      <Tabs defaultValue="managers" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="managers">Managers</Tabs.Tab>
          <Tabs.Tab value="crew">Employees</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="managers" pt="md">
          <ManagersTab />
        </Tabs.Panel>
        <Tabs.Panel value="crew" pt="md">
          <CrewTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
