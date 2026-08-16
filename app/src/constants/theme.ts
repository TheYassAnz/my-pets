import '@/global.css';

import { Platform } from 'react-native';

// Doit rester synchronisé avec les variables CSS de src/global.css.
// NativeWind lit les CSS vars, mais certaines props RN (placeholderTextColor)
// n'acceptent qu'une couleur résolue depuis ce fichier.

export const Colors = {
  light: {
    surface: '#FFFFFF',
    surfaceElevated: '#FAFAFA',
    surfaceSunken: '#F0F0F2',
    border: '#EBEBEF',

    text: '#0A0A0B',
    textSecondary: '#71717A',
    textTertiary: '#A1A1AA',

    primary: '#0A0A0B',
    primaryPressed: '#27272A',
    onPrimary: '#FFFFFF',

    statusOk: '#0D9488',
    statusSoon: '#B45309',
    statusLate: '#DC2626',
    danger: '#DC2626',
    dangerSurface: '#FEF2F2',
  },
  dark: {
    surface: '#0B0B0C',
    surfaceElevated: '#141416',
    surfaceSunken: '#1C1C1F',
    border: '#232326',

    text: '#FAFAFA',
    textSecondary: '#9A9AA2',
    textTertiary: '#6E6E76',

    primary: '#FAFAFA',
    primaryPressed: '#E4E4E7',
    onPrimary: '#0A0A0B',

    statusOk: '#2DD4BF',
    statusSoon: '#FBBF24',
    statusLate: '#F87171',
    danger: '#F87171',
    dangerSurface: '#3B1614',
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

// Le reste de l'échelle typo vit dans tailwind.config.js (fontSize) et se
// consomme via className, comme partout ailleurs dans l'app. `metric` est
// l'exception : lettrage négatif + tabular-nums ne passent pas de façon
// fiable par une classe NativeWind, donc il se pose en style RN direct.
export const Typography = {
  metric: { fontSize: 48, lineHeight: 52, fontWeight: '700', letterSpacing: -1.5 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
