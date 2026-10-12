import { fireEvent, render, screen } from '@testing-library/react-native';

import SignInScreen from '@/app/sign-in';
import SignUpScreen from '@/app/sign-up';

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock('@/lib/auth-context', () => ({
  useSession: () => ({ signIn: mockSignIn, signUp: mockSignUp }),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn() },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Connexion', () => {
  it('affiche le titre et le bouton, et signale un e-mail manquant', async () => {
    await render(<SignInScreen />);
    expect(screen.getByText('Connexion')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByText('Email requis')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});

describe('Inscription', () => {
  it('affiche le titre et le bouton, et signale un e-mail manquant', async () => {
    await render(<SignUpScreen />);
    expect(screen.getByText('Créer un compte')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));

    expect(await screen.findByText('Email requis')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
