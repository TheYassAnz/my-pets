import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    surface: '#F3F5FE',
    surfaceElevated: '#FFFFFF',
    surfaceSunken: '#E4E7F5',
    border: '#CFD3E5',

    text: '#292B31',
    textSecondary: '#595D6C',
    textTertiary: '#9397AB',

    primary: '#796CBF',
    primaryPressed: '#5D5294',
    onPrimary: '#FFFFFF',

    brand: '#796CBF',
    brandPressed: '#5D5294',
    onBrand: '#FFFFFF',

    statusOk: '#2E7D47',
    statusSoon: '#B45309',
    statusLate: '#DC2626',
    danger: '#DC2626',
    dangerSurface: '#FEE2E2',
  },
  dark: {
    surface: '#232532',
    surfaceElevated: '#2B2D3C',
    surfaceSunken: '#161826',
    border: '#3F424D',

    text: '#E9E9ED',
    textSecondary: '#9397AB',
    textTertiary: '#75798C',

    primary: '#9184D9',
    primaryPressed: '#B5ABFC',
    onPrimary: '#161826',

    brand: '#9184D9',
    brandPressed: '#B5ABFC',
    onBrand: '#161826',

    statusOk: '#96CCA8',
    statusSoon: '#DDC98A',
    statusLate: '#E2919F',
    danger: '#E2919F',
    dangerSurface: '#381E27',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Typography = {
  metric: { fontSize: 48, lineHeight: 52, fontWeight: '700', letterSpacing: -1.5 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
