import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'lg',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  components: {
    TextInput: { defaultProps: { size: 'md', radius: 'sm' } },
    PasswordInput: { defaultProps: { size: 'md', radius: 'sm' } },
    Select: { defaultProps: { size: 'md', radius: 'sm' } },
    MultiSelect: { defaultProps: { radius: 'sm' } },
    NumberInput: { defaultProps: { radius: 'sm' } },
    Autocomplete: { defaultProps: { radius: 'sm' } },
    Input: { defaultProps: { radius: 'sm' } },
    Button: { defaultProps: { size: 'md' } },
    Modal: {
      styles: {
        title: { fontSize: 'var(--mantine-font-size-xl)', fontWeight: 700 }
      }
    }
  }
});
