import React from 'react';
import { Redirect, Tabs } from 'expo-router';

import AnimalsIndex from '@/app/(app)/animals/index';
import TabsLayout from '@/app/(app)/(tabs)/_layout';
import { Colors } from '@/constants/theme';

jest.mock('expo-router', () => {
  const Tabs = Object.assign(jest.fn(() => null), { Screen: jest.fn(() => null) });
  return { Tabs, Redirect: jest.fn(() => null) };
});
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));

describe('(tabs)/_layout', () => {
  it('déclare trois onglets dans l’ordre, sans header', () => {
    const el = TabsLayout();
    expect(el.type).toBe(Tabs);
    expect(el.props.screenOptions).toMatchObject({
      headerShown: false,
      tabBarActiveTintColor: Colors.light.text,
      tabBarInactiveTintColor: Colors.light.textTertiary,
      tabBarStyle: { height: 64 + 34 },
      tabBarLabelStyle: { lineHeight: 16 },
    });
    const screens = React.Children.toArray(el.props.children) as React.ReactElement<any>[];
    expect(screens.map((s) => s.props.name)).toEqual(['index', 'upcoming', 'account']);
    expect(screens.map((s) => s.props.options.title)).toEqual(['Animaux', 'À venir', 'Compte']);
    expect(screens.map((s) => s.props.options.tabBarAccessibilityLabel)).toEqual(['Animaux', 'À venir', 'Compte']);
  });

  it('/animals redirige vers l’onglet Animaux', () => {
    const el = AnimalsIndex();
    expect(el.type).toBe(Redirect);
    expect(el.props.href).toBe('/');
  });
});
