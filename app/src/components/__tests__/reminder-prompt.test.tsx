import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ReminderPrompt } from '@/components/reminder-prompt';
import { enablePushReminders, pushSupported } from '@/lib/notifications';

jest.mock('@/lib/notifications', () => ({
  pushSupported: jest.fn(),
  enablePushReminders: jest.fn(),
}));

const g = globalThis as Record<string, unknown>;
const IOS_TEXT =
  "Pour recevoir les rappels sur iPhone, ajoutez my-pets à l'écran d'accueil (Partager, puis « Sur l'écran d'accueil »). Vous les recevez aussi par email.";

function setup(opts: { supported: boolean; permission?: string; ua?: string; standalone?: boolean }) {
  (pushSupported as jest.Mock).mockReturnValue(opts.supported);
  g.Notification = { permission: opts.permission ?? 'default' };
  g.navigator = { userAgent: opts.ua ?? 'Chrome', platform: 'Linux', maxTouchPoints: 0 };
  g.window = { matchMedia: () => ({ matches: !!opts.standalone }) };
}

afterAll(() => {
  delete g.window;
  delete g.Notification;
});

it('bouton Activer les rappels, disparaît après granted', async () => {
  setup({ supported: true });
  (enablePushReminders as jest.Mock).mockResolvedValue('granted');
  await render(<ReminderPrompt />);
  await fireEvent.press(screen.getByText('Activer les rappels'));
  expect(enablePushReminders).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByText('Activer les rappels')).toBeNull());
});

it('iPhone non installé : consigne, aucun bouton', async () => {
  setup({ supported: false, ua: 'Mozilla iPhone Safari' });
  await render(<ReminderPrompt />);
  expect(screen.getByText(IOS_TEXT)).toBeTruthy();
  expect(screen.queryByText('Activer les rappels')).toBeNull();
});

it('iPadOS (Mac tactile) non installé : consigne', async () => {
  setup({ supported: false, ua: 'Macintosh' });
  (g.navigator as { platform: string; maxTouchPoints: number }).platform = 'MacIntel';
  (g.navigator as { maxTouchPoints: number }).maxTouchPoints = 5;
  await render(<ReminderPrompt />);
  expect(screen.getByText(IOS_TEXT)).toBeTruthy();
});

beforeEach(() => jest.clearAllMocks());

it('permission granted : rien rendu, ré-abonnement unique', async () => {
  setup({ supported: true, permission: 'granted' });
  (enablePushReminders as jest.Mock).mockResolvedValue('granted');
  await render(<ReminderPrompt />);
  expect(screen.toJSON()).toBeNull();
  expect(enablePushReminders).toHaveBeenCalledTimes(1);
});

it('permission granted : un rejet au montage est ignoré', async () => {
  setup({ supported: true, permission: 'granted' });
  (enablePushReminders as jest.Mock).mockRejectedValue(new Error('boom'));
  await render(<ReminderPrompt />);
  expect(screen.toJSON()).toBeNull();
});

it('permission denied : rien rendu, aucun appel', async () => {
  setup({ supported: true, permission: 'denied' });
  await render(<ReminderPrompt />);
  expect(screen.toJSON()).toBeNull();
  expect(enablePushReminders).not.toHaveBeenCalled();
});

it("clic renvoyant 'unsupported' : bouton conservé et erreur affichée", async () => {
  setup({ supported: true });
  (enablePushReminders as jest.Mock).mockResolvedValue('unsupported');
  await render(<ReminderPrompt />);
  await fireEvent.press(screen.getByText('Activer les rappels'));
  expect(await screen.findByText("Impossible d'activer les rappels. Réessayez.")).toBeTruthy();
  expect(screen.getByText('Activer les rappels')).toBeTruthy();
});

it.each([
  ['non supporté hors iOS', { supported: false }],
  ['iOS installé', { supported: false, ua: 'iPhone', standalone: true }],
])('ne rend rien : %s', async (_n, opts) => {
  setup(opts);
  await render(<ReminderPrompt />);
  expect(screen.toJSON()).toBeNull();
});
