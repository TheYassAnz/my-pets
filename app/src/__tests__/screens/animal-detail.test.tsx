import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import AnimalDetailScreen from '@/app/(app)/animals/[id]/index';

const mockGetAnimal = jest.fn();
const mockListEvents = jest.fn();
const mockListWeights = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    getAnimal: (...a: unknown[]) => mockGetAnimal(...a),
    listEvents: (...a: unknown[]) => mockListEvents(...a),
    listWeights: (...a: unknown[]) => mockListWeights(...a),
  },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    router: { push: jest.fn(), back: jest.fn() },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => ({ id: 'a1' }),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});

const ev = (o: object) => ({
  id: 'e', type: 'VACCINE', title: 'Typhus-coryza', date: '2026-03-03', vet: null, dosage: null, nextDueDate: null, ...o,
});
const wt = (o: object) => ({ id: 'w', weightKg: 4.2, date: '2026-05-10', animalId: 'a1', ...o });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'], now: new Date('2026-10-12') });
  mockGetAnimal.mockResolvedValue({ id: 'a1', name: 'Nala', species: 'Chat', birthDate: '2023-01-05T00:00:00.000Z', photoUrl: null });
  mockListEvents.mockResolvedValue([
    ev({ id: 'e1', date: '2026-03-03', nextDueDate: '2027-03-03' }),
    ev({ id: 'e2', type: 'VISIT', title: 'Contrôle', date: '2026-06-01' }),
    ev({ id: 'e3', type: 'TREATMENT', title: 'Vermifuge', date: '2026-04-01', nextDueDate: '2026-10-20' }),
  ]);
  mockListWeights.mockResolvedValue([
    wt({ id: 'w1', weightKg: 4.2, date: '2026-05-10' }),
    wt({ id: 'w2', weightKg: 4.1, date: '2026-02-10' }),
  ]);
});
afterEach(() => jest.useRealTimers());

describe('Fiche animal', () => {
  it('affiche nom, âge, poids en vedette et variation', async () => {
    await render(<AnimalDetailScreen />);
    expect(await screen.findByText('Nala')).toBeTruthy();
    expect(screen.getByText('Chat · 3 ans')).toBeTruthy();
    expect(screen.getAllByText('4,2 kg')[0].props.className).toContain('text-hero');
    expect(screen.getByText('+0,1 kg depuis février')).toBeTruthy();
  });

  it('chronologie fusionnée triée par date décroissante', async () => {
    await render(<AnimalDetailScreen />);
    await screen.findByText('Nala');
    const titles = screen.getAllByText(/^(Typhus-coryza|Contrôle|Vermifuge|Pesée)$/).map((n) => n.props.children);
    expect(titles).toEqual(['Contrôle', 'Pesée', 'Vermifuge', 'Typhus-coryza', 'Pesée']);
  });

  it('chaque filtre ne garde que son type, EmptyState si vide', async () => {
    await render(<AnimalDetailScreen />);
    await screen.findByText('Nala');
    await fireEvent.press(screen.getByLabelText('Visites'));
    expect(screen.getByText('Contrôle')).toBeTruthy();
    expect(screen.queryByText('Vermifuge')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Soins'));
    expect(screen.getByText('Vermifuge')).toBeTruthy();
    expect(screen.queryByText('Contrôle')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Pesées'));
    expect(screen.queryByText('Vermifuge')).toBeNull();
    expect(screen.getAllByText('Pesée')).toHaveLength(2);
  });

  it('EmptyState quand le filtre est vide', async () => {
    mockListEvents.mockResolvedValue([ev({ id: 'e1' })]);
    await render(<AnimalDetailScreen />);
    await screen.findByText('Nala');
    await fireEvent.press(screen.getByLabelText('Visites'));
    expect(screen.getByText('Aucune entrée')).toBeTruthy();
  });

  it('« Prochain » en ambre si proche, gris sinon', async () => {
    await render(<AnimalDetailScreen />);
    await screen.findByText('Nala');
    expect(screen.getByText(/Prochain : 20 oct/).props.className).toContain('text-status-soon');
    expect(screen.getByText(/Prochain : 03 mars 2027/).props.className).toContain('text-text-secondary');
  });

  it('erreur : ErrorState puis réessai rappelle les 3 appels', async () => {
    mockGetAnimal.mockRejectedValueOnce(new Error('x'));
    await render(<AnimalDetailScreen />);
    await fireEvent.press(await screen.findByText('Réessayer'));
    expect(await screen.findByText('Nala')).toBeTruthy();
    expect(mockGetAnimal).toHaveBeenCalledTimes(2);
    expect(mockListEvents).toHaveBeenCalledTimes(2);
    expect(mockListWeights).toHaveBeenCalledTimes(2);
  });

  it('navigation : événement oui, pesée non, ajout, modification', async () => {
    await render(<AnimalDetailScreen />);
    await screen.findByText('Nala');
    await fireEvent.press(screen.getByLabelText('Vaccin Typhus-coryza, 03 mars 2026, prochain 03 mars 2027'));
    expect(router.push).toHaveBeenCalledWith('/animals/a1/events/e1');
    jest.clearAllMocks();
    await fireEvent.press(screen.getAllByText('Pesée')[0]);
    expect(router.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Ajouter une entrée'));
    expect(router.push).toHaveBeenCalledWith('/animals/a1/events/new');
    await fireEvent.press(screen.getByLabelText('Modifier Nala'));
    expect(router.push).toHaveBeenCalledWith('/animals/a1/edit');
  });
});
