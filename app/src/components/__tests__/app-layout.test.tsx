import { Stack } from 'expo-router';

import AppLayout from '@/app/(app)/_layout';

jest.mock('expo-router', () => ({ Stack: jest.fn(() => null) }));

describe('(app)/_layout', () => {
  it('rend une pile sans header natif (plus de barre d’onglets)', () => {
    const element = AppLayout();
    expect(element.type).toBe(Stack);
    expect(element.props.screenOptions).toEqual({ headerShown: false });
  });
});
