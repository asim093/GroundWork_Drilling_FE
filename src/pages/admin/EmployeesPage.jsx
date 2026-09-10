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
import { EmployeeFormModal } from '../../components/admin/EmployeeFormModal.jsx';
import { useListParams } from '../../hooks/useListParams.js';
import { EMPLOYEE_CATEGORY_OPTIONS, EMPLOYEE_TYPE_OPTIONS } from '../../constants/employees.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';
import { NavIcon } from '../../components/NavIcon.jsx';
import { employeesService } from '../../services/masterDataService.js';
import { extractErrorMessage } from '../../services/api.js';
import { notifyError, notifySuccess } from '../../lib/toast.js';

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
];

export const EmployeesPage = () => {
  usePageTitle('Employees');
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

  const rows = result.data.map((employee) => (
    <Table.Tr key={employee.id}>
      <Table.Td>{employee.name}</Table.Td>
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
    <Stack gap="md">
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap" align="center">
            <TextInput
              placeholder="Search name"
              value={filters.search || ''}
              onChange={(event) => setFilter('search', event.currentTarget.value)}
              w={300}
            />
            <Select
              placeholder="Any employee type"
              data={EMPLOYEE_TYPE_OPTIONS}
              value={filters.employeeType || null}
              onChange={(value) => setFilter('employeeType', value)}
              clearable
              w={200}
            />
            <Select
              placeholder="Any category"
              data={EMPLOYEE_CATEGORY_OPTIONS}
              value={filters.employeeCategory || null}
              onChange={(value) => setFilter('employeeCategory', value)}
              clearable
              w={160}
            />
            <Select
              placeholder="Any state"
              data={ACTIVE_FILTER_OPTIONS}
              value={filters.active || null}
              onChange={(value) => setFilter('active', value)}
              clearable
              w={150}
            />
            <Button ml="auto" leftSection={<NavIcon name="plus" size={16} />} onClick={openNewEmployee}>
              New employee
            </Button>
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
                    <Table.Th>Employee type</Table.Th>
                    <Table.Th>Category</Table.Th>
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
                          No employees match the current filters
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

      <EmployeeFormModal
        opened={modal.open}
        employee={modal.employee}
        onClose={() => setModal({ open: false, employee: null })}
        onSaved={load}
      />
    </Stack>
  );
};
