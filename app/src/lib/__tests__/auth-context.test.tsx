import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { clearLegacyTokens, SessionProvider, useSession } from '@/lib/auth-context';

const mockLogout = jest.fn();
const mockSave = jest.fn().mockResolvedValue(undefined);
const mockOutcome = jest.fn().mockResolvedValue('ok');
const mockMe = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    savePushSubscription: (...a: unknown[]) => mockSave(...a),
    me: () => mockMe(),
    logout: () => mockLogout(),
  },
  refreshOutcome: () => mockOutcome(),
  ApiError: class extends Error {
    status: number;
    constructor(status: number, m: string) {
      super(m);
      this.status = status;
    }
  },
  setAccessToken: jest.fn(),
}));
const mockSub = { toJSON: () => ({ endpoint: 'e' }), unsubscribe: jest.fn().mockResolvedValue(true) };
jest.mock('@/lib/notifications', () => ({ detachPushSubscription: async () => mockSub }));

const sessionRef: { current: ReturnType<typeof useSession> } = { current: undefined! };
function Probe() {
  const session = useSession();
  sessionRef.current = session; // eslint-disable-line react-hooks/immutability -- capture de test, objet mutable externe
  return (
    <>
      <Text>{session.isLoading ? 'chargement' : (session.user?.email ?? 'anonyme')}</Text>
      <Text>{session.restoreFailed ? 'echec' : 'ok'}</Text>
    </>
  );
}

beforeEach(() => {
  mockOutcome.mockReset().mockResolvedValue('ok');
  mockMe.mockReset().mockResolvedValue({ id: 'u', email: 'a@b.c', createdAt: '' });
});

const renderProvider = () =>
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );

it('signOut rejette et garde la session si api.logout échoue', async () => {
  mockLogout.mockRejectedValue(new Error('500'));
  await render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  expect(await screen.findByText('a@b.c')).toBeTruthy();

  await act(async () => {
    await expect(sessionRef.current.signOut()).rejects.toThrow('500');
  });
  expect(screen.getByText('a@b.c')).toBeTruthy();
  expect(mockSave).toHaveBeenCalledWith({ endpoint: 'e' });
  expect(mockSub.unsubscribe).not.toHaveBeenCalled();
});

describe('restauration de session', () => {
  it('refus (denied) : anonyme, pas d\'erreur', async () => {
    mockOutcome.mockResolvedValue('denied');
    await renderProvider();
    expect(await screen.findByText('anonyme')).toBeTruthy();
    expect(screen.getByText('ok')).toBeTruthy();
  });

  it('injoignable : restoreFailed vrai et isLoading faux', async () => {
    mockOutcome.mockResolvedValue('unreachable');
    await renderProvider();
    expect(await screen.findByText('echec')).toBeTruthy();
    expect(screen.queryByText('chargement')).toBeNull();
  });

  it('retryRestore relance et récupère la session', async () => {
    mockOutcome.mockResolvedValueOnce('unreachable').mockResolvedValueOnce('ok');
    await renderProvider();
    expect(await screen.findByText('echec')).toBeTruthy();
    await act(async () => {
      sessionRef.current.retryRestore();
    });
    expect(await screen.findByText('a@b.c')).toBeTruthy();
    expect(screen.getByText('ok')).toBeTruthy();
  });

  it('me() en 401 → anonyme', async () => {
    const { ApiError } = jest.requireMock('@/lib/api');
    mockMe.mockRejectedValue(new ApiError(401, 'non'));
    await renderProvider();
    expect(await screen.findByText('anonyme')).toBeTruthy();
    expect(screen.getByText('ok')).toBeTruthy();
  });

  it('me() en 500 → restoreFailed vrai', async () => {
    const { ApiError } = jest.requireMock('@/lib/api');
    mockMe.mockRejectedValue(new ApiError(500, 'boom'));
    await renderProvider();
    expect(await screen.findByText('echec')).toBeTruthy();
  });
});

describe('clearLegacyTokens', () => {
  afterEach(() => {
    delete (global as { localStorage?: unknown }).localStorage;
  });

  it('supprime les deux clés héritées', () => {
    const store: Record<string, string> = {
      'mypets.accessToken': 'a',
      'mypets.refreshToken': 'r',
      autre: 'x',
    };
    (global as { localStorage?: unknown }).localStorage = {
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    clearLegacyTokens();
    expect(store).toEqual({ autre: 'x' });
  });

  it('ne lève pas sans localStorage', () => {
    delete (global as { localStorage?: unknown }).localStorage;
    expect(() => clearLegacyTokens()).not.toThrow();
  });
});
