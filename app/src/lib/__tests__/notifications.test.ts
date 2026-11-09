import { api } from '@/lib/api';
import { disablePushReminders, enablePushReminders, pushSupported } from '@/lib/notifications';
import { registerServiceWorker } from '@/lib/pwa';

jest.mock('@/lib/api', () => ({
  api: { savePushSubscription: jest.fn(), removePushSubscription: jest.fn() },
}));
jest.mock('@/lib/pwa', () => ({ registerServiceWorker: jest.fn() }));

const g = globalThis as Record<string, unknown>;
const subscription = {
  endpoint: 'https://push/1',
  toJSON: () => ({ endpoint: 'https://push/1', keys: { p256dh: 'p', auth: 'a' } }),
  unsubscribe: jest.fn().mockResolvedValue(true),
};
const pushManager = { subscribe: jest.fn(), getSubscription: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY = 'AQID'; // [1,2,3]
  g.window = { PushManager: class {} };
  g.Notification = { requestPermission: jest.fn().mockResolvedValue('granted') };
  (api.removePushSubscription as jest.Mock).mockResolvedValue(undefined);
  (api.savePushSubscription as jest.Mock).mockResolvedValue(undefined);
  pushManager.subscribe.mockResolvedValue(subscription);
  pushManager.getSubscription.mockResolvedValue(subscription);
  (registerServiceWorker as jest.Mock).mockResolvedValue({ pushManager });
});

afterAll(() => {
  delete g.window;
  delete g.Notification;
});

it('sans PushManager : non supporté, aucun appel API', async () => {
  g.window = {};
  expect(pushSupported()).toBe(false);
  expect(await enablePushReminders()).toBe('unsupported');
  expect(api.savePushSubscription).not.toHaveBeenCalled();
});

it('sans clé VAPID : non supporté', async () => {
  delete process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;
  expect(await enablePushReminders()).toBe('unsupported');
  expect(pushManager.subscribe).not.toHaveBeenCalled();
});

it('permission accordée : abonne puis enregistre', async () => {
  expect(await enablePushReminders()).toBe('granted');
  const arg = pushManager.subscribe.mock.calls[0][0];
  expect(arg.userVisibleOnly).toBe(true);
  expect(Array.from(arg.applicationServerKey)).toEqual([1, 2, 3]);
  expect(api.savePushSubscription).toHaveBeenCalledWith({
    endpoint: 'https://push/1',
    keys: { p256dh: 'p', auth: 'a' },
  });
});

it('permission refusée : denied, aucun appel API', async () => {
  (g.Notification as { requestPermission: jest.Mock }).requestPermission.mockResolvedValue('denied');
  expect(await enablePushReminders()).toBe('denied');
  expect(pushManager.subscribe).not.toHaveBeenCalled();
  expect(api.savePushSubscription).not.toHaveBeenCalled();
});

describe('disablePushReminders', () => {
  it('supprime côté serveur puis désabonne', async () => {
    await disablePushReminders();
    expect(api.removePushSubscription).toHaveBeenCalledWith('https://push/1');
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it('sans abonnement : rien', async () => {
    pushManager.getSubscription.mockResolvedValue(null);
    await disablePushReminders();
    expect(api.removePushSubscription).not.toHaveBeenCalled();
  });

  it("ne lève pas si l'API échoue", async () => {
    (api.removePushSubscription as jest.Mock).mockRejectedValue(new Error('500'));
    await expect(disablePushReminders()).resolves.toBeUndefined();
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
