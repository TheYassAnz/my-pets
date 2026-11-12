import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ToastProvider } from '@/components/ui';
import { confirmAction, notifyError } from '@/lib/dialog';
import EditHealthEventScreen from '@/app/(app)/animals/[id]/events/[eventId]';

const mockGetEvent = jest.fn();
const mockGetAnimal = jest.fn();
const mockDeleteEvent = jest.fn();

jest.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    getEvent: (...a: unknown[]) => mockGetEvent(...a),
    getAnimal: (...a: unknown[]) => mockGetAnimal(...a),
    deleteEvent: (...a: unknown[]) => mockDeleteEvent(...a),
    updateEvent: jest.fn(),
  },
}));
jest.mock('@/lib/dialog', () => ({ confirmAction: jest.fn(), notifyError: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'a1', eventId: 'e1' }),
  useFocusEffect: (cb: () => void) => jest.requireActual('react').useEffect(cb, [cb]),
}));

const event = {
  id: 'e1', type: 'VACCINE', title: 'Rage', date: '2026-11-21T00:00:00.000Z',
  dosage: null, vet: null, notes: null, nextDueDate: null,
};

const setup = async () => {
  await render(
    <ToastProvider>
      <EditHealthEventScreen />
    </ToastProvider>,
  );
  await screen.findByText('Modifier l\'entrée');
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetEvent.mockResolvedValue(event);
  mockGetAnimal.mockResolvedValue({ id: 'a1', name: 'Nala', photoUrl: null });
  mockDeleteEvent.mockResolvedValue(undefined);
});

describe('Fiche événement', () => {
  it('charge l’événement et l’animal', async () => {
    await setup();
    expect(mockGetEvent).toHaveBeenCalledWith('a1', 'e1');
    expect(await screen.findByText('Pour Nala')).toBeTruthy();
  });

  it('suppression confirmée : deleteEvent puis retour', async () => {
    (confirmAction as jest.Mock).mockResolvedValue(true);
    await setup();
    await fireEvent.press(screen.getByLabelText('Supprimer'));
    await waitFor(() => expect(mockDeleteEvent).toHaveBeenCalledWith('a1', 'e1'));
    expect(router.back).toHaveBeenCalled();
  });

  it('suppression refusée : rien', async () => {
    (confirmAction as jest.Mock).mockResolvedValue(false);
    await setup();
    await fireEvent.press(screen.getByLabelText('Supprimer'));
    await waitFor(() => expect(confirmAction).toHaveBeenCalled());
    expect(mockDeleteEvent).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('échec de suppression : notifyError', async () => {
    (confirmAction as jest.Mock).mockResolvedValue(true);
    mockDeleteEvent.mockRejectedValue(new Error('boom'));
    await setup();
    await fireEvent.press(screen.getByLabelText('Supprimer'));
    await waitFor(() => expect(notifyError).toHaveBeenCalledWith('Suppression impossible'));
    expect(router.back).not.toHaveBeenCalled();
  });

  it('erreur de chargement : bouton Retour disponible', async () => {
    mockGetEvent.mockRejectedValue(new Error('x'));
    await render(
      <ToastProvider>
        <EditHealthEventScreen />
      </ToastProvider>,
    );
    await fireEvent.press(await screen.findByLabelText('Retour'));
    expect(router.back).toHaveBeenCalled();
  });
});
