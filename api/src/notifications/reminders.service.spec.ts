import { Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { RemindersService } from './reminders.service';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

const sendNotification = webpush.sendNotification as unknown as jest.Mock;

const day = 86_400_000;
const inDays = (n: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * day);
};

const sub = (id: string) => ({
  id,
  endpoint: `https://p/${id}`,
  p256dh: 'k',
  auth: 'a',
});

const owner = (
  email: string,
  subs = [sub('s1'), sub('s2')],
  lead = [15, 1],
) => ({
  email,
  reminderLeadDays: lead,
  pushSubscriptions: subs,
});

const event = (
  days: number,
  o: ReturnType<typeof owner>,
  title = 'Vaccin rage',
  animal = 'Rex',
  animalId = 'a1',
) => ({
  id: 'e',
  title,
  animalId,
  nextDueDate: inDays(days),
  animal: { name: animal, owner: o },
});

describe('RemindersService', () => {
  let prisma: {
    healthEvent: { findMany: jest.Mock };
    pushSubscription: { delete: jest.Mock };
  };
  let mail: { sendReminderDigest: jest.Mock };
  const env = { ...process.env };

  const make = () => new RemindersService(prisma as never, mail as never);
  const run = (events: unknown[]) => {
    prisma.healthEvent.findMany.mockResolvedValue(events);
    return make().sendDueReminders();
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    process.env.VAPID_PUBLIC_KEY = 'pub';
    process.env.VAPID_PRIVATE_KEY = 'priv';
    process.env.VAPID_SUBJECT = 'mailto:a@b.fr';
    sendNotification.mockReset().mockResolvedValue({});
    prisma = {
      healthEvent: { findMany: jest.fn() },
      pushSubscription: { delete: jest.fn().mockResolvedValue({}) },
    };
    mail = { sendReminderDigest: jest.fn().mockResolvedValue(undefined) };
  });

  afterAll(() => {
    process.env = env;
  });

  it('envoie push et email pour une échéance à J-15', async () => {
    await run([event(15, owner('a@b.fr'))]);
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://p/s1' }),
      JSON.stringify({
        title: 'Rappel santé — Rex',
        body: 'Vaccin rage dans 15 jours',
        url: '/animals/a1',
      }),
      { timeout: 10_000 },
    );
    expect(mail.sendReminderDigest).toHaveBeenCalledTimes(1);
    expect(mail.sendReminderDigest).toHaveBeenCalledWith('a@b.fr', [
      'Rex — Vaccin rage dans 15 jours',
    ]);
  });

  it("n'envoie rien à J-10", async () => {
    await run([event(10, owner('a@b.fr'))]);
    expect(sendNotification).not.toHaveBeenCalled();
    expect(mail.sendReminderDigest).not.toHaveBeenCalled();
  });

  it("formule J-0 en aujourd'hui et J-1 en dans 1 jour", async () => {
    await run([
      event(0, owner('a@b.fr', [], [0, 1])),
      event(1, owner('a@b.fr', [], [0, 1])),
    ]);
    const lines = (
      mail.sendReminderDigest.mock.calls as [string, string[]][]
    ).flatMap((c) => c[1]);
    expect(lines).toEqual(
      expect.arrayContaining([
        "Rex — Vaccin rage aujourd'hui",
        'Rex — Vaccin rage dans 1 jour',
      ]),
    );
  });

  it('regroupe en un seul email par propriétaire', async () => {
    const o = owner('a@b.fr');
    await run([event(15, o), event(1, o, 'Vermifuge')]);
    expect(mail.sendReminderDigest).toHaveBeenCalledTimes(1);
    expect((mail.sendReminderDigest.mock.calls as string[][])[0][1]).toEqual([
      'Rex — Vaccin rage dans 15 jours',
      'Rex — Vermifuge dans 1 jour',
    ]);
  });

  it.each([410, 404])(
    'supprime un abonnement expiré (%i) et continue',
    async (statusCode) => {
      sendNotification.mockRejectedValueOnce({ statusCode });
      await run([event(15, owner('a@b.fr'))]);
      expect(prisma.pushSubscription.delete).toHaveBeenCalledTimes(1);
      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
      expect(sendNotification).toHaveBeenCalledTimes(2);
      expect(mail.sendReminderDigest).toHaveBeenCalledTimes(1);
    },
  );

  it("conserve l'abonnement sur erreur 500", async () => {
    sendNotification.mockRejectedValue({ statusCode: 500 });
    await run([event(15, owner('a@b.fr'))]);
    expect(prisma.pushSubscription.delete).not.toHaveBeenCalled();
  });

  it("continue pour B quand l'email de A échoue", async () => {
    mail.sendReminderDigest.mockRejectedValueOnce(new Error('resend'));
    await expect(
      run([
        event(15, owner('a@a.fr', [sub('a1')])),
        event(15, owner('b@b.fr', [sub('b1')])),
      ]),
    ).resolves.toBeUndefined();
    expect(mail.sendReminderDigest).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });

  it('sans clé VAPID : emails seuls, pas de push', async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    await run([event(15, owner('a@b.fr'))]);
    expect(sendNotification).not.toHaveBeenCalled();
    expect(mail.sendReminderDigest).toHaveBeenCalledTimes(1);
  });

  it('propriétaire sans abonnement : email seul', async () => {
    await run([event(15, owner('a@b.fr', []))]);
    expect(sendNotification).not.toHaveBeenCalled();
    expect(mail.sendReminderDigest).toHaveBeenCalledTimes(1);
  });
});
