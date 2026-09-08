import { useNavigate } from 'react-router-dom';
import { ActionIcon, Button, Menu } from '@mantine/core';
import { NavIcon } from './NavIcon.jsx';

export const HeaderCreateMenu = ({ actions = [] }) => {
  const navigate = useNavigate();

  if (!actions.length) {
    return null;
  }

  if (actions.length === 1) {
    const [only] = actions;

    return (
      <>
        <Button
          visibleFrom="sm"
          onClick={() => navigate(only.to)}
          leftSection={<NavIcon name="plus" size={15} />}
          size="sm"
          radius="sm"
        >
          {only.label}
        </Button>
        <ActionIcon
          hiddenFrom="sm"
          onClick={() => navigate(only.to)}
          aria-label={only.label}
          variant="filled"
          size={34}
          radius="sm"
        >
          <NavIcon name="plus" size={18} />
        </ActionIcon>
      </>
    );
  }

  const dropdown = (
    <Menu.Dropdown>
      <Menu.Label>Create</Menu.Label>
      {actions.map((action) => (
        <Menu.Item key={action.to} onClick={() => navigate(action.to)}>
          {action.label}
        </Menu.Item>
      ))}
    </Menu.Dropdown>
  );

  return (
    <>
      <Menu position="bottom-end" shadow="md" radius="sm" width={200}>
        <Menu.Target>
          <Button
            visibleFrom="sm"
            leftSection={<NavIcon name="plus" size={15} />}
            rightSection={<NavIcon name="chevronDown" size={13} />}
            size="sm"
            radius="sm"
          >
            New
          </Button>
        </Menu.Target>
        {dropdown}
      </Menu>

      <Menu position="bottom-end" shadow="md" radius="sm" width={200}>
        <Menu.Target>
          <ActionIcon
            hiddenFrom="sm"
            variant="filled"
            size={34}
            radius="sm"
            aria-label="Create"
          >
            <NavIcon name="plus" size={18} />
          </ActionIcon>
        </Menu.Target>
        {dropdown}
      </Menu>
    </>
  );
};
