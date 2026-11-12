import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import MyAnimalsScreen from '@/app/(app)/(tabs)/index';

const mockListAnimals = jest.fn();

jest.mock('@/lib/api', () => ({ api: { listAnimals: (...a: unknown[]) => mockListAnimals(...a) } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    router: { push: jest.fn() },
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});

const animal = (o: object) => ({
  id: 'x',
  name: 'X',
  species: 'Chat',
  birthDate: null,
  photoUrl: null,
  latestWeight: null,
  createdAt: '2020-01-01',
  ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Mes animaux', () => {
  it('affiche les animaux, poids en virgule et « — » sans poids', async () => {
    mockListAnimals.mockResolvedValue([
      animal({ id: '1', name: 'Nala', latestWeight: 4.2 }),
      animal({ id: '2', name: 'Rex', species: 'Chien' }),
    ]);
    await render(<MyAnimalsScreen />);
    expect(await screen.findByText('Nala')).toBeTruthy();
    expect(screen.getByText('4,2 kg')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Nala, chat, 4,2 kg'));
    expect(router.push).toHaveBeenCalledWith('/animals/1');
  });

  it('affiche l’âge et la photo', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'], now: new Date('2026-10-12') });
    mockListAnimals.mockResolvedValue([
      animal({ id: '1', name: 'Nala', birthDate: '2023-01-05T00:00:00.000Z', photoUrl: 'https://x/y.jpg' }),
    ]);
    await render(<MyAnimalsScreen />);
    expect(await screen.findByText('Chat · 3 ans')).toBeTruthy();
    jest.useRealTimers();
  });

  it('échec d’actualisation : message affiché, liste conservée', async () => {
    mockListAnimals.mockResolvedValueOnce([animal({ id: '1', name: 'Nala' })]);
    await render(<MyAnimalsScreen />);
    await screen.findByText('Nala');
    mockListAnimals.mockRejectedValue(new Error('boom'));
    const { refreshControl } = screen.getByTestId('animals-scroll').props;
    await act(() => refreshControl.props.onRefresh());
    expect(await screen.findByText("Impossible d'actualiser. Réessayez.")).toBeTruthy();
    expect(screen.getByText('Nala')).toBeTruthy();
  });

  it('liste vide : EmptyState', async () => {
    mockListAnimals.mockResolvedValue([]);
    await render(<MyAnimalsScreen />);
    expect(await screen.findByText('Ajoutez votre premier animal')).toBeTruthy();
  });

  it('erreur : ErrorState, « Réessayer » rappelle listAnimals', async () => {
    mockListAnimals.mockRejectedValueOnce(new Error('boom'));
    await render(<MyAnimalsScreen />);
    mockListAnimals.mockResolvedValue([animal({ id: '1', name: 'Nala' })]);
    await fireEvent.press(await screen.findByText('Réessayer'));
    expect(await screen.findByText('Nala')).toBeTruthy();
    expect(mockListAnimals).toHaveBeenCalledTimes(2);
  });

  it('« Ajouter un animal » mène à /animals/new', async () => {
    mockListAnimals.mockResolvedValue([animal({ id: '1', name: 'Nala' })]);
    await render(<MyAnimalsScreen />);
    await fireEvent.press(await screen.findByLabelText('Ajouter un animal'));
    expect(router.push).toHaveBeenCalledWith('/animals/new');
  });

  it('n’affiche plus le bouton compte / déconnexion', async () => {
    mockListAnimals.mockResolvedValue([]);
    await render(<MyAnimalsScreen />);
    await screen.findByText('Mes animaux');
    expect(screen.queryByLabelText('Compte et déconnexion')).toBeNull();
  });

  it('n’affiche pas l’invite « Activer les rappels » tant que les rappels sont coupés', async () => {
    // Stubs pour que pushSupported() soit vrai : l'invite s'afficherait si elle était montée.
    const w = window as unknown as Record<string, unknown>;
    const g = globalThis as unknown as Record<string, unknown>;
    const prev = { pm: w.PushManager, n: g.Notification, key: process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY };
    w.PushManager = function PushManager() {};
    g.Notification = { permission: 'default', requestPermission: jest.fn() };
    process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY = 'test-key';
    try {
      mockListAnimals.mockResolvedValue([]);
      await render(<MyAnimalsScreen />);
      expect(await screen.findByText('Mes animaux')).toBeTruthy();
      expect(screen.queryByText('Activer les rappels')).toBeNull();
    } finally {
      if (prev.pm === undefined) delete w.PushManager; else w.PushManager = prev.pm;
      if (prev.n === undefined) delete g.Notification; else g.Notification = prev.n;
      if (prev.key === undefined) delete process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY; else process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY = prev.key;
    }
  });
});
