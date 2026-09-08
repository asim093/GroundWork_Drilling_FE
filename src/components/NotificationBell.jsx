import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActionIcon, Box, Indicator, Menu, Stack, Text } from '@mantine/core';
import { NavIcon } from './NavIcon.jsx';
import { getAttention } from '../services/dashboardService.js';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [data, setData] = useState({ count: 0, items: [] });

  const load = useCallback(async () => {
    try {
      setData(await getAttention());
    } catch {
      setData({ count: 0, items: [] });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, pathname]);

  return (
    <Menu position="bottom-end" shadow="md" radius="md" width={330} onOpen={load}>
      <Menu.Target>
        <Indicator
          label={data.count > 9 ? '9+' : data.count}
          size={16}
          color="red"
          offset={7}
          disabled={data.count === 0}
          withBorder
        >
          <ActionIcon variant="subtle" color="gray" size={36} radius="sm" aria-label="Needs attention">
            <NavIcon name="bell" size={19} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Needs attention</Menu.Label>
        {data.items.length === 0 ? (
          <Box px="sm" py="md">
            <Text size="sm" c="dimmed">
              You&apos;re all caught up.
            </Text>
          </Box>
        ) : (
          data.items.map((item) => (
            <Menu.Item key={item.id} onClick={() => navigate(item.to)}>
              <Stack gap={2}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </Stack>
            </Menu.Item>
          ))
        )}
      </Menu.Dropdown>
    </Menu>
  );
};
