import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import SignInScreen from '@/app/sign-in';
import SignUpScreen from '@/app/sign-up';

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useSession: () => ({ signIn: mockSignIn, signUp: mockSignUp }),
}));
jest.mock('expo-router', () => {
  const { cloneElement } = jest.requireActual('react');
  const routerMock = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
  return {
    router: routerMock,
    // Link asChild : le lien enfant navigue vers `href`.
    Link: ({ href, children }: { href: string; children: React.ReactElement }) =>
      cloneElement(children, { onPress: () => routerMock.push(href) }),
  };
});

beforeEach(() => jest.clearAllMocks());

async function fill(label: string, value: string) {
  await fireEvent.changeText(screen.getByLabelText(label), value);
}

describe('Connexion', () => {
  it('bascule vers l’inscription sans empiler (replace)', async () => {
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByText('Créer un compte'));
    expect(router.replace).toHaveBeenCalledWith('/sign-up');
  });

  it('« Mot de passe oublié ? » mène à forgot-password', async () => {
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByText('Mot de passe oublié ?'));
    expect(router.push).toHaveBeenCalledWith('/forgot-password');
  });

  it('soumet l’e-mail nettoyé en minuscules avec le mot de passe', async () => {
    mockSignIn.mockResolvedValue(undefined);
    await render(<SignInScreen />);
    await fill('E-mail', '  Yassine@Mail.COM ');
    await fill('Mot de passe', 'secret123');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    await screen.findByText('Connexion');
    expect(mockSignIn).toHaveBeenCalledWith('yassine@mail.com', 'secret123');
  });

  it('affiche le message d’erreur quand signIn rejette', async () => {
    mockSignIn.mockRejectedValue(new Error('Identifiants invalides'));
    await render(<SignInScreen />);
    await fill('E-mail', 'a@b.fr');
    await fill('Mot de passe', 'secret123');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByText('Identifiants invalides')).toBeTruthy();
  });
});

describe('Inscription', () => {
  async function fillValid() {
    await fill('E-mail', 'New@Mail.fr');
    await fill('Mot de passe', 'secret123');
    await fill('Confirmer le mot de passe', 'secret123');
  }

  it('bascule vers la connexion sans empiler (replace)', async () => {
    await render(<SignUpScreen />);
    await fireEvent.press(screen.getByText('Se connecter'));
    expect(router.replace).toHaveBeenCalledWith('/sign-in');
  });

  it('refuse l’envoi quand les CGU sont décochées', async () => {
    await render(<SignUpScreen />);
    await fillValid();
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByText('Veuillez accepter les conditions d’utilisation')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('appelle signUp quand les CGU sont cochées et le formulaire valide', async () => {
    mockSignUp.mockResolvedValue(undefined);
    await render(<SignUpScreen />);
    await fillValid();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    await screen.findByText('Créer un compte');
    expect(mockSignUp).toHaveBeenCalledWith('new@mail.fr', 'secret123');
  });
});
