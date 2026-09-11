import { ActionIcon } from '@mantine/core';
import { NavIcon } from '../NavIcon.jsx';

/** Bottom-right floating "+" action button, shown only below the card breakpoint. */
export const MobileFab = ({ onClick, label = 'Add', hiddenFrom = 'lg' }) => (
  <ActionIcon
    hiddenFrom={hiddenFrom}
    onClick={onClick}
    aria-label={label}
    radius="xl"
    size={54}
    variant="filled"
    color="brand"
    style={{
      position: 'fixed',
      right: 18,
      bottom: 18,
      zIndex: 200,
      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.28)'
    }}
  >
    <NavIcon name="plus" size={22} />
  </ActionIcon>
);
