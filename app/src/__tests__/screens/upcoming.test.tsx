import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import UpcomingScreen from '@/app/(app)/(tabs)/upcoming';

const mockList = jest.fn();
let mockFocusKey = 0;

jest.mock('@/lib/api', () => ({ api: { listUpcomingEvents: (...a: unknown[]) => mockList(...a) } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => {
  const { useEffect: useEff } = jest.requireActual('react');
  return {
    router: { push: jest.fn() },
    useFocusEffect: (cb: () => void) => useEff(cb, [cb, mockFocusKey]),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFocusKey = 0;
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'], now: new Date('2026-11-12T10:00:00') });
});
afterEach(() => jest.useRealTimers());

const event = { id: 'e1', type: 'VACCINE', title: 'Rage', date: '2025-11-20', nextDueDate: '2026-11-20', dueDate: '2026-11-20', animalId: 'a1', animalName: 'Nala' };

describe('À venir', () => {
  it('liste les échéances avec animal, date et badge', async () => {
    mockList.mockResolvedValue([event]);
    await render(<UpcomingScreen />);
    expect(await screen.findByText('Rage')).toBeTruthy();
    expect(screen.getByText(/Nala · 20 nov\.? 2026/)).toBeTruthy();
    expect(screen.getByText('Dans 8 j')).toBeTruthy();
    await fireEvent.press(screen.getByText('Rage'));
    expect(router.push).toHaveBeenCalledWith('/animals/a1/events/e1');
  });

  it('affiche « Aujourd’hui » pour une échéance du jour', async () => {
    mockList.mockResolvedValue([{ ...event, nextDueDate: '2026-11-12', dueDate: '2026-11-12' }]);
    await render(<UpcomingScreen />);
    expect(await screen.findByText('Aujourd’hui')).toBeTruthy();
  });

  it('visite planifiée sans prochaine échéance : affichée à sa date', async () => {
    mockList.mockResolvedValue([
      { ...event, type: 'VISIT', title: 'Contrôle', date: '2026-11-29', nextDueDate: null, dueDate: '2026-11-29' },
    ]);
    await render(<UpcomingScreen />);
    expect(await screen.findByText('Contrôle')).toBeTruthy();
    expect(screen.getByText(/Nala · 29 nov\.? 2026/)).toBeTruthy();
    expect(screen.getByText('Dans 17 j')).toBeTruthy();
  });

  it('liste vide : EmptyState', async () => {
    mockList.mockResolvedValue([]);
    await render(<UpcomingScreen />);
    expect(await screen.findByText('Aucune échéance dans les 3 prochains mois')).toBeTruthy();
  });

  it('erreur puis « Réessayer » rappelle l’API', async () => {
    mockList.mockRejectedValueOnce(new Error('x')).mockResolvedValue([event]);
    await render(<UpcomingScreen />);
    expect(await screen.findByText('Impossible de charger les échéances.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Réessayer'));
    expect(await screen.findByText('Rage')).toBeTruthy();
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('recharge à chaque focus', async () => {
    mockList.mockResolvedValue([]);
    const { rerender } = await render(<UpcomingScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    mockFocusKey = 1;
    await rerender(<UpcomingScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });
});
