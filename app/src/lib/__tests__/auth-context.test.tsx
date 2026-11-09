import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { clearLegacyTokens, SessionProvider, useSession } from '@/lib/auth-context';

const mockLogout = jest.fn();
const mockSave = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/api', () => ({
  api: {
    savePushSubscription: (...a: unknown[]) => mockSave(...a),
    me: async () => ({ id: 'u', email: 'a@b.c', createdAt: '' }),
    logout: () => mockLogout(),
  },
  refreshSession: async () => true,
  setAccessToken: jest.fn(),
}));
const mockSub = { toJSON: () => ({ endpoint: 'e' }), unsubscribe: jest.fn().mockResolvedValue(true) };
jest.mock('@/lib/notifications', () => ({ detachPushSubscription: async () => mockSub }));

let session: ReturnType<typeof useSession>;
function Probe() {
  session = useSession();
  return <Text>{session.isLoading ? 'chargement' : (session.user?.email ?? 'anonyme')}</Text>;
}

it('signOut rejette et garde la session si api.logout échoue', async () => {
  mockLogout.mockRejectedValue(new Error('500'));
  await render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  expect(await screen.findByText('a@b.c')).toBeTruthy();

  await act(async () => {
    await expect(session.signOut()).rejects.toThrow('500');
  });
  expect(screen.getByText('a@b.c')).toBeTruthy();
  expect(mockSave).toHaveBeenCalledWith({ endpoint: 'e' });
  expect(mockSub.unsubscribe).not.toHaveBeenCalled();
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
