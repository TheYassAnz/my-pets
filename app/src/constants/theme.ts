import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSunken: '#F2F2F4',
    border: '#ECECEE',

    text: '#0A0A0A',
    textSecondary: '#8A8A8E',
    textTertiary: '#B4B4B8',

    primary: '#0A0A0A',
    primaryPressed: '#3A3A3C',
    onPrimary: '#FFFFFF',

    brand: '#0A0A0A',
    brandPressed: '#3A3A3C',
    onBrand: '#FFFFFF',

    statusOk: '#00A862',
    statusSoon: '#D97706',
    statusLate: '#DC2626',
    danger: '#DC2626',
    dangerSurface: '#FEE2E2',

    typeVaccine: '#FFD9CF',
    typeVaccineFg: '#E5532F',
    typeTreatment: '#FFEBB8',
    typeTreatmentFg: '#B97A00',
    typeVisit: '#D5EFE0',
    typeVisitFg: '#2E8B57',
    typeWeight: '#DDE4FF',
    typeWeightFg: '#4B5FD6',
  },
  dark: {
    surface: '#000000',
    surfaceElevated: '#0E0E10',
    surfaceSunken: '#1C1C1E',
    border: '#2C2C2E',

    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',

    primary: '#FFFFFF',
    primaryPressed: '#D1D1D6',
    onPrimary: '#000000',

    brand: '#FFFFFF',
    brandPressed: '#D1D1D6',
    onBrand: '#000000',

    statusOk: '#2FD27A',
    statusSoon: '#F5A524',
    statusLate: '#FF6B6B',
    danger: '#FF6B6B',
    dangerSurface: '#3A1414',

    typeVaccine: '#3B2620',
    typeVaccineFg: '#FF8A6B',
    typeTreatment: '#3A3018',
    typeTreatmentFg: '#F2C14E',
    typeVisit: '#1F3329',
    typeVisitFg: '#5FD39A',
    typeWeight: '#232A4A',
    typeWeightFg: '#8FA0FF',
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
  metric: { fontSize: 46, lineHeight: 50, fontWeight: '800', letterSpacing: -1.6 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
