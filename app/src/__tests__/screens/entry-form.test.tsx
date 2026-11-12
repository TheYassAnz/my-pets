import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { EntryForm } from '@/components/entry-form';
import { ToastProvider } from '@/components/ui';
import { toIsoDate } from '@/lib/dates';

const mockCreateEvent = jest.fn();
const mockAddWeight = jest.fn();
const mockPicker = jest.fn();

jest.mock('@expo/ui/community/datetime-picker', () => ({
  DateTimePicker: (props: unknown) => {
    mockPicker(props);
    return null;
  },
}));

jest.mock('@/lib/api', () => ({
  api: {
    createEvent: (...a: unknown[]) => mockCreateEvent(...a),
    addWeight: (...a: unknown[]) => mockAddWeight(...a),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const TODAY = '2026-10-12';

const setup = () =>
  render(
    <ToastProvider>
      <EntryForm animalId="a1" animal={{ name: 'Nala', photoUrl: null }} />
    </ToastProvider>,
  );

const save = () => fireEvent.press(screen.getByLabelText('Enregistrer'));
const openDatePicker = () => fireEvent.press(screen.getByLabelText(/^Date,/));
const lastPickerProps = () => mockPicker.mock.calls.at(-1)[0];

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'queueMicrotask'], now: new Date(`${TODAY}T12:00:00`) });
  mockCreateEvent.mockResolvedValue({});
  mockAddWeight.mockResolvedValue({});
});
afterEach(() => jest.useRealTimers());

describe('Nouvelle entrée', () => {
  it('affiche le rappel et les champs vaccin', async () => {
    await setup();
    expect(screen.getByText('Pour Nala')).toBeTruthy();
    expect(screen.getByLabelText('Produit')).toBeTruthy();
    expect(screen.getByLabelText(/^Prochaine échéance/)).toBeTruthy();
    expect(screen.getByLabelText('Note')).toBeTruthy();
    expect(screen.queryByLabelText('Vétérinaire')).toBeNull();
  });

  it('vaccin : createEvent avec le bon payload puis retour', async () => {
    await setup();
    await fireEvent.changeText(screen.getByLabelText('Produit'), '  Rage ');
    await save();
    expect(mockCreateEvent).toHaveBeenCalledWith('a1', {
      type: 'VACCINE', title: 'Rage', date: TODAY,
      dosage: undefined, vet: undefined, notes: undefined, nextDueDate: undefined,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it('soin : type TREATMENT', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Soin'));
    await fireEvent.changeText(screen.getByLabelText('Produit'), 'Vermifuge');
    await save();
    expect(mockCreateEvent).toHaveBeenCalledWith('a1', expect.objectContaining({ type: 'TREATMENT', title: 'Vermifuge' }));
  });

  it('visite : Motif et Vétérinaire, pas de prochaine échéance', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Visite'));
    expect(screen.queryByLabelText(/^Prochaine échéance/)).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Motif'), 'Contrôle');
    await fireEvent.changeText(screen.getByLabelText('Vétérinaire'), 'Dr Martin');
    await save();
    expect(mockCreateEvent).toHaveBeenCalledWith('a1', expect.objectContaining({ type: 'VISIT', title: 'Contrôle', vet: 'Dr Martin' }));
  });

  it('poids : « 4,2 » → addWeight(a1, 4.2, date)', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Poids'));
    expect(screen.queryByLabelText('Produit')).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Poids (kg)'), '4,2');
    await save();
    await waitFor(() => expect(mockAddWeight).toHaveBeenCalledWith('a1', 4.2, TODAY));
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it('poids invalide : message, aucun appel', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Poids'));
    await fireEvent.changeText(screen.getByLabelText('Poids (kg)'), 'abc');
    await save();
    expect(await screen.findByText('Poids invalide')).toBeTruthy();
    expect(mockAddWeight).not.toHaveBeenCalled();
  });

  it('changer de type réinitialise les champs spécifiques', async () => {
    await setup();
    await fireEvent.changeText(screen.getByLabelText('Produit'), 'Rage');
    await fireEvent.press(screen.getByLabelText('Soin'));
    expect(screen.getByLabelText('Produit').props.value).toBe('');
  });

  it('erreur API affichée, réessayable', async () => {
    mockCreateEvent.mockRejectedValueOnce(new Error('Serveur indisponible'));
    await setup();
    await fireEvent.changeText(screen.getByLabelText('Produit'), 'Rage');
    await save();
    expect(await screen.findByText('Serveur indisponible')).toBeTruthy();
    expect(router.back).not.toHaveBeenCalled();
    await save();
    expect(mockCreateEvent).toHaveBeenCalledTimes(2);
    expect(router.back).toHaveBeenCalled();
  });

  it('pas de double soumission pendant le chargement (entrée clavier répétée)', async () => {
    let resolve!: () => void;
    mockAddWeight.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    await setup();
    await fireEvent.press(screen.getByLabelText('Poids'));
    await fireEvent.changeText(screen.getByLabelText('Poids (kg)'), '4,2');
    const input = screen.getByLabelText('Poids (kg)');
    await act(async () => {
      input.props.onSubmitEditing();
      input.props.onSubmitEditing();
    });
    expect(mockAddWeight).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
  });

  it('visite : date future acceptée', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Visite'));
    await openDatePicker();
    expect(lastPickerProps().maximumDate).toBeUndefined();
    await act(async () => lastPickerProps().onValueChange(null, new Date(2026, 11, 1)));
    await fireEvent.press(screen.getByText('Valider'));
    await fireEvent.changeText(screen.getByLabelText('Motif'), 'Contrôle');
    await save();
    expect(mockCreateEvent).toHaveBeenCalledWith('a1', expect.objectContaining({ type: 'VISIT', date: '2026-12-01' }));
  });

  it('poids : date bornée à aujourd’hui', async () => {
    await setup();
    await fireEvent.press(screen.getByLabelText('Poids'));
    await openDatePicker();
    expect(toIsoDate(lastPickerProps().maximumDate)).toBe(TODAY);
  });

  it('vaccin → poids : une date future reportée est refusée, aucun appel', async () => {
    await setup();
    await openDatePicker();
    await act(async () => lastPickerProps().onValueChange(null, new Date(2026, 11, 1)));
    await fireEvent.press(screen.getByText('Valider'));
    await fireEvent.press(screen.getByLabelText('Poids'));
    await fireEvent.changeText(screen.getByLabelText('Poids (kg)'), '4,2');
    await save();
    expect(await screen.findByText('La date ne peut pas être dans le futur')).toBeTruthy();
    expect(mockAddWeight).not.toHaveBeenCalled();
  });
});
