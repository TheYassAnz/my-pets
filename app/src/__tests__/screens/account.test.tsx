import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import AccountScreen from '@/app/(app)/(tabs)/account';

const mockSignOut = jest.fn();
const mockSetTheme = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useSession: () => ({ user: { email: 'yassine@mail.com' }, signOut: mockSignOut }),
}));
jest.mock('@/lib/color-scheme', () => ({ setThemePreference: (...a: unknown[]) => mockSetTheme(...a) }));
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockSignOut.mockResolvedValue(undefined);
});

// jest-expo n'expose pas window.confirm/alert : on les définit avant de les espionner.
function spyDialog(name: 'confirm' | 'alert') {
  (window as unknown as Record<string, unknown>)[name] = () => undefined;
  return jest.spyOn(window, name);
}

describe('Compte', () => {
  it('affiche l’email du compte', async () => {
    await render(<AccountScreen />);
    expect(screen.getByText('yassine@mail.com')).toBeTruthy();
  });

  it('bascule le thème', async () => {
    await render(<AccountScreen />);
    await fireEvent.press(screen.getByText('Mode sombre'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('la déconnexion ne se fait qu’après confirmation', async () => {
    const confirm = spyDialog('confirm').mockReturnValue(false);
    await render(<AccountScreen />);
    await fireEvent.press(screen.getByText('Se déconnecter'));
    expect(confirm).toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await fireEvent.press(screen.getByText('Se déconnecter'));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  });

  it('affiche un message si la déconnexion échoue', async () => {
    mockSignOut.mockRejectedValue(new Error('500'));
    spyDialog('confirm').mockReturnValue(true);
    const alert = spyDialog('alert').mockImplementation(() => {});
    await render(<AccountScreen />);
    await fireEvent.press(screen.getByText('Se déconnecter'));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        'Déconnexion impossible. Vérifiez votre connexion et réessayez.',
      ),
    );
  });
});
