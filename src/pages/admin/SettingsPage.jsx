import { useEffect, useRef, useState } from 'react';
import { Group, Stack, Tabs } from '@mantine/core';
import { ChevronRight } from 'tabler-icons-react';
import { MasterDataPanel } from '../../components/settings/MasterDataPanel.jsx';
import { ActivitiesPanel } from '../../components/settings/ActivitiesPanel.jsx';
import {
  activityCategoriesService,
  consumablesService,
  locationsService,
  rigNumbersService
} from '../../services/masterDataService.js';
import { usePageTitle } from '../../context/PageTitleContext.jsx';

const CONSUMABLE_GROUP_COLUMN = {
  label: 'Group',
  kind: 'text',
  required: false,
  payloadKey: 'group',
  filterParam: 'group',
  filterPlaceholder: 'All groups',
  distinctKey: 'group',
  render: (record) => record.group || '—',
  initialValue: (record) => record.group || ''
};

export const SettingsPage = () => {
  usePageTitle('Settings');
  const [activeTab, setActiveTab] = useState('locations');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsListRef = useRef(null);
  const scrollCheckTimeoutRef = useRef(null);

  // Check and update scroll state
  const updateScrollState = () => {
    if (!tabsListRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
    const tolerance = 5; // pixels

    setCanScrollLeft(scrollLeft > tolerance);

    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance);
  };

  // Auto-scroll active tab into view and update scroll state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tabsListRef.current) {
        const activeTabElement = tabsListRef.current.querySelector('[role="tab"][aria-selected="true"]');
        if (activeTabElement) {
          activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
        updateScrollState();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Handle scroll events
  const handleTabsScroll = () => {
    if (scrollCheckTimeoutRef.current) clearTimeout(scrollCheckTimeoutRef.current);
    scrollCheckTimeoutRef.current = setTimeout(updateScrollState, 100);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    updateScrollState(); // Initial check
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollCheckTimeoutRef.current) clearTimeout(scrollCheckTimeoutRef.current);
    };
  }, []);

  return (
    <Stack gap="md">
      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
        <Group pos="relative" gap={0}>
          <Tabs.List
            ref={tabsListRef}
            onScroll={handleTabsScroll}
            className={`${canScrollLeft ? 'has-scroll-left' : ''} ${canScrollRight ? 'has-scroll-right' : ''}`.trim()}
            style={{ flex: 1 }}
          >
            <Tabs.Tab value="locations">Locations</Tabs.Tab>
            <Tabs.Tab value="rig-numbers">Rig numbers</Tabs.Tab>
            <Tabs.Tab value="consumables">Consumables</Tabs.Tab>
            <Tabs.Tab value="activity-categories">Activity categories</Tabs.Tab>
            <Tabs.Tab value="activities">Activities</Tabs.Tab>
          </Tabs.List>
          
        </Group>

        <Tabs.Panel value="locations" pt="md">
          <MasterDataPanel service={locationsService} singular="Location" plural="Locations" />
        </Tabs.Panel>
        <Tabs.Panel value="rig-numbers" pt="md">
          <MasterDataPanel service={rigNumbersService} singular="Rig number" plural="Rig numbers" />
        </Tabs.Panel>
        
        <Tabs.Panel value="consumables" pt="md">
          <MasterDataPanel
            service={consumablesService}
            singular="Consumable"
            plural="Consumables"
            extraColumn={CONSUMABLE_GROUP_COLUMN}
          />
        </Tabs.Panel>
        <Tabs.Panel value="activity-categories" pt="md">
          <MasterDataPanel
            service={activityCategoriesService}
            singular="Activity category"
            plural="Activity categories"
          />
        </Tabs.Panel>
        <Tabs.Panel value="activities" pt="md">
          <ActivitiesPanel />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
