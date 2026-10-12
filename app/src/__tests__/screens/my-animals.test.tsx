import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import MyAnimalsScreen from '@/app/(app)/index';

const mockListAnimals = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/lib/api', () => ({ api: { listAnimals: (...a: unknown[]) => mockListAnimals(...a) } }));
jest.mock('@/lib/auth-context', () => ({
  useSession: () => ({ user: { email: 'yassine@mail.com' }, signOut: mockSignOut }),
}));
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

beforeEach(() => jest.clearAllMocks());

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

  it('la déconnexion demande confirmation', async () => {
    mockListAnimals.mockResolvedValue([]);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<MyAnimalsScreen />);
    await fireEvent.press(await screen.findByLabelText('Compte et déconnexion'));
    expect(alert).toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
    alert.mock.calls[0][2]![1].onPress!();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
