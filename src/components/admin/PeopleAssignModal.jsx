import { Button, Group, Modal, Stack, Tabs } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';
import { SiteManagerPicker } from './SiteManagerPicker.jsx';
import { RosterPicker } from './RosterPicker.jsx';

const TabLabel = ({ icon, children }) => (
  <Group gap={6} wrap="nowrap">
    <NavIcon name={icon} size={15} />
    <span>{children}</span>
  </Group>
);

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
          <Tabs.Tab value="managers">
            <TabLabel icon="users">Managers ({siteManagers.length})</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab value="crew">
            <TabLabel icon="idCard">Crew ({rosterEmployeeIds.length})</TabLabel>
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
