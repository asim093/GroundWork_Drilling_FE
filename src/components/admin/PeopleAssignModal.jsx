import { Button, Group, Modal, Stack, Tabs } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { SiteManagerPicker } from './SiteManagerPicker.jsx';
import { RosterPicker } from './RosterPicker.jsx';

export const PeopleAssignModal = ({
  opened,
  onClose,
  siteManagers = [],
  rosterEmployeeIds = [],
  operators = [],
  employees = [],
  onChange
}) => (
  <Modal opened={opened} onClose={onClose} title="Manage people" centered size="lg">
    <Stack gap="md">
      <Tabs defaultValue="managers" keepMounted={false}>
        <Tabs.List grow>
          <Tabs.Tab value="managers" leftSection={<NavIcon name="users" size={15} />}>
            Managers ({siteManagers.length})
          </Tabs.Tab>
          <Tabs.Tab value="crew" leftSection={<NavIcon name="idCard" size={15} />}>
            Crew ({rosterEmployeeIds.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="managers" pt="md">
          <SiteManagerPicker
            value={siteManagers}
            operators={operators}
            onChange={(next) => onChange({ siteManagers: next, rosterEmployeeIds })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="crew" pt="md">
          <RosterPicker
            value={rosterEmployeeIds}
            employees={employees}
            onChange={(next) => onChange({ siteManagers, rosterEmployeeIds: next })}
          />
        </Tabs.Panel>
      </Tabs>

      <Group justify="flex-end">
        <Button onClick={onClose}>Done</Button>
      </Group>
    </Stack>
  </Modal>
);
