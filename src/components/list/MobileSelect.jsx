import { NativeSelect } from '@mantine/core';

/**
 * Drop-in replacement for Mantine's Select inside MobileFilterDrawer.
 * Renders a real <select> so the browser's own native picker handles
 * positioning — no floating-ui popover to mis-place when the on-screen
 * keyboard resizes the viewport.
 */
export const MobileSelect = ({ label, placeholder, data, value, onChange, ...rest }) => {
  const options = (data || []).map((item) =>
    typeof item === 'string' ? { value: item, label: item } : item
  );

  return (
    <NativeSelect
      label={label}
      data={[{ value: '', label: placeholder || 'Any' }, ...options]}
      value={value || ''}
      onChange={(event) => onChange(event.currentTarget.value || null)}
      {...rest}
    />
  );
};
