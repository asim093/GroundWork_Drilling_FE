import { createTheme } from '@mantine/core';

const brand = [
  '#ecf6f6',
  '#d6eaea',
  '#add4d6',
  '#80bec1',
  '#5aabaf',
  '#419aa0',
  '#348a90',
  '#286d73',
  '#1f575c',
  '#123a3e'
];

const sand = [
  '#f6f6f4',
  '#eeeeea',
  '#dcdcd4',
  '#c6c6ba',
  '#a9a99a',
  '#8c8c7d',
  '#6f6f61',
  '#54544a',
  '#3b3b34',
  '#242420'
];

const FONT = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  autoContrast: true,
  luminanceThreshold: 0.35,
  colors: { brand, sand },
  white: '#ffffff',
  black: '#1a2422',
  defaultRadius: 'md',
  fontFamily: FONT,
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  headings: {
    fontFamily: FONT,
    fontWeight: '640',
    sizes: {
      h1: { fontSize: '1.85rem', lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: '1.4rem', lineHeight: '1.25', fontWeight: '680' },
      h3: { fontSize: '1.15rem', lineHeight: '1.3', fontWeight: '660' },
      h4: { fontSize: '1rem', lineHeight: '1.35', fontWeight: '640' }
    }
  },
  radius: { xs: '4px', sm: '8px', md: '11px', lg: '16px', xl: '22px' },
  shadows: {
    xs: '0 1px 2px rgba(18, 58, 62, 0.06)',
    sm: '0 1px 2px rgba(18, 58, 62, 0.05), 0 6px 16px -8px rgba(18, 58, 62, 0.10)',
    md: '0 6px 22px -10px rgba(18, 58, 62, 0.14)',
    lg: '0 16px 40px -16px rgba(18, 58, 62, 0.20)',
    xl: '0 28px 60px -22px rgba(18, 58, 62, 0.24)'
  },
  components: {
    TextInput: { defaultProps: { size: 'md', radius: 'md' } },
    PasswordInput: { defaultProps: { size: 'md', radius: 'md' } },
    Select: { defaultProps: { size: 'md', radius: 'md' } },
    MultiSelect: { defaultProps: { radius: 'md' } },
    NumberInput: { defaultProps: { radius: 'md' } },
    Autocomplete: { defaultProps: { radius: 'md' } },
    TimePicker: { defaultProps: { radius: 'md' } },
    TimeInput: { defaultProps: { radius: 'md' } },
    Textarea: { defaultProps: { radius: 'md' } },
    Input: { defaultProps: { radius: 'md' } },
    Button: {
      defaultProps: { size: 'md' },
      styles: { root: { fontWeight: 600, letterSpacing: '-0.005em' } }
    },
    ActionIcon: { defaultProps: { radius: 'md' } },
    Paper: { defaultProps: { radius: 'lg' } },
    Card: { defaultProps: { radius: 'lg' } },
    Badge: { defaultProps: { radius: 'sm' }, styles: { root: { fontWeight: 600, letterSpacing: '0.01em' } } },
    Accordion: { defaultProps: { radius: 'lg' } },
    Modal: {
      defaultProps: { radius: 'lg' },
      styles: { title: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 680 } }
    },
    Drawer: { styles: { title: { fontSize: 'var(--mantine-font-size-lg)', fontWeight: 680 } } },
    Tooltip: { defaultProps: { radius: 'sm', withArrow: true } }
  }
});
