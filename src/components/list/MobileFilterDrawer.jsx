import { ActionIcon, Drawer, Indicator, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NavIcon } from '../NavIcon.jsx';

/** Icon button + Drawer wrapper for filter controls on narrow screens (hiddenFrom="sm" callers). */
export const MobileFilterDrawer = ({ activeCount = 0, children, title = 'Filters' }) => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Indicator label={activeCount} size={16} disabled={!activeCount} color="brand" offset={4}>
        <ActionIcon variant="default" size="lg" radius="md" onClick={open} aria-label="Open filters">
          <NavIcon name="filter" size={17} />
        </ActionIcon>
      </Indicator>
      <Drawer
        opened={opened}
        onClose={close}
        title={title}
        position="bottom"
        padding="md"
        styles={{
          content: { maxHeight: '70vh', height: 'auto' },
          body: { maxHeight: 'calc(70vh - 60px)', overflowY: 'auto' }
        }}
      >
        <Stack gap="sm" pb="md">
          {children}
        </Stack>
      </Drawer>
    </>
  );
};
