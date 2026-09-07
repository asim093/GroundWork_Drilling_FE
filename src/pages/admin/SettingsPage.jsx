import { Stack, Tabs } from '@mantine/core';
import { MasterDataPanel } from '../../components/settings/MasterDataPanel.jsx';
import { BonusConfigPanel } from '../../components/settings/BonusConfigPanel.jsx';
import {
  consumablesService,
  locationsService,
  rigNumbersService
} from '../../services/masterDataService.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';

export const SettingsPage = () => {
  usePageTitle('Settings');

  return (
    <Stack gap="md">
      <Tabs defaultValue="locations" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="locations">Locations</Tabs.Tab>
          <Tabs.Tab value="rig-numbers">Rig numbers</Tabs.Tab>
          <Tabs.Tab value="consumables">Consumables</Tabs.Tab>
          <Tabs.Tab value="bonus">Bonus config</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="locations" pt="md">
          <MasterDataPanel service={locationsService} singular="Location" plural="Locations" />
        </Tabs.Panel>
        <Tabs.Panel value="rig-numbers" pt="md">
          <MasterDataPanel service={rigNumbersService} singular="Rig number" plural="Rig numbers" />
        </Tabs.Panel>
        <Tabs.Panel value="consumables" pt="md">
          <MasterDataPanel service={consumablesService} singular="Consumable" plural="Consumables" />
        </Tabs.Panel>
        <Tabs.Panel value="bonus" pt="md">
          <BonusConfigPanel />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
