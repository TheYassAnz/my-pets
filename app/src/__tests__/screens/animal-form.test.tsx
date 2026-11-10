import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import EditAnimalScreen from '@/app/(app)/animals/[id]/edit';
import NewAnimalScreen from '@/app/(app)/animals/new';

const mockApi = {
  createAnimal: jest.fn(),
  updateAnimal: jest.fn(),
  getAnimal: jest.fn(),
  deleteAnimal: jest.fn(),
  uploadAnimalPhoto: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  api: {
    createAnimal: (...a: unknown[]) => mockApi.createAnimal(...a),
    updateAnimal: (...a: unknown[]) => mockApi.updateAnimal(...a),
    getAnimal: (...a: unknown[]) => mockApi.getAnimal(...a),
    deleteAnimal: (...a: unknown[]) => mockApi.deleteAnimal(...a),
    uploadAnimalPhoto: (...a: unknown[]) => mockApi.uploadAnimalPhoto(...a),
  },
  ApiError: class ApiError extends Error {},
}));
jest.mock('@/components/ui/toast', () => ({ useToast: () => ({ show: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    router: { back: jest.fn(), replace: jest.fn() },
    Stack: { Screen: () => null },
    useLocalSearchParams: () => ({ id: 'a1' }),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});
const mockPicker = {
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
};
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...a: unknown[]) =>
    mockPicker.requestMediaLibraryPermissionsAsync(...a),
  launchImageLibraryAsync: (...a: unknown[]) => mockPicker.launchImageLibraryAsync(...a),
}));

const animal = {
  id: 'a1',
  name: 'Nala',
  species: 'Chat',
  birthDate: '2023-03-14T00:00:00.000Z',
  photoUrl: null,
};

beforeEach(() => jest.clearAllMocks());

// jest-expo n'expose pas window.confirm/alert : on les définit avant de les espionner.
function spyDialog(name: 'confirm' | 'alert') {
  (window as unknown as Record<string, unknown>)[name] = () => undefined;
  return jest.spyOn(window, name);
}

describe('Nouvel animal', () => {
  it('crée l’animal avec nom, espèce et naissance puis revient', async () => {
    mockApi.createAnimal.mockResolvedValue({ ...animal, id: 'n1' });
    await render(<NewAnimalScreen />);
    expect(screen.getByText('Nouvel animal')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Nom'), '  Nala ');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Chat' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByText('Nouvel animal');
    expect(mockApi.createAnimal).toHaveBeenCalledWith({
      name: 'Nala',
      species: 'Chat',
      birthDate: undefined,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it('nom vide : message d’erreur, aucun appel API', async () => {
    await render(<NewAnimalScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Nom requis')).toBeTruthy();
    expect(mockApi.createAnimal).not.toHaveBeenCalled();
  });

  it('envoie la photo choisie après la création', async () => {
    mockApi.createAnimal.mockResolvedValue({ ...animal, id: 'n1' });
    mockApi.uploadAnimalPhoto.mockResolvedValue(animal);
    mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockPicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///p.jpg', fileName: 'p.jpg', mimeType: 'image/jpeg' }],
    });
    await render(<NewAnimalScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Changer la photo' }));
    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Nala');
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    await screen.findByText('Nouvel animal');
    expect(mockApi.uploadAnimalPhoto).toHaveBeenCalledWith('n1', {
      uri: 'file:///p.jpg',
      name: 'p.jpg',
      type: 'image/jpeg',
    });
  });
});

describe('Modifier un animal', () => {
  it('préremplit nom et espèce', async () => {
    mockApi.getAnimal.mockResolvedValue(animal);
    await render(<EditAnimalScreen />);
    expect(await screen.findByText('Modifier Nala')).toBeTruthy();
    expect(screen.getByLabelText('Nom').props.value).toBe('Nala');
    expect(screen.getByRole('checkbox', { name: 'Chat' }).props.accessibilityState.checked).toBe(true);
  });

  it('suppression : confirmation puis deleteAnimal et retour à l’accueil', async () => {
    mockApi.getAnimal.mockResolvedValue(animal);
    mockApi.deleteAnimal.mockResolvedValue(undefined);
    const confirm = spyDialog('confirm').mockReturnValueOnce(false).mockReturnValue(true);
    await render(<EditAnimalScreen />);
    const del = await screen.findByRole('button', { name: "Supprimer l'animal" });

    await fireEvent.press(del);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(mockApi.deleteAnimal).not.toHaveBeenCalled();

    await fireEvent.press(del);
    await waitFor(() => expect(mockApi.deleteAnimal).toHaveBeenCalledWith('a1'));
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
