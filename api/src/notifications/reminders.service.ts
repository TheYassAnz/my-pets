import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as webpush from 'web-push';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma.service';

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};
type Reminder = { animalId: string; animal: string; body: string };
type OwnerReminders = {
  email: string;
  subscriptions: Subscription[];
  reminders: Reminder[];
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private readonly pushEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    this.pushEnabled = !!(
      VAPID_PUBLIC_KEY &&
      VAPID_PRIVATE_KEY &&
      VAPID_SUBJECT
    );
    if (this.pushEnabled) {
      webpush.setVapidDetails(
        VAPID_SUBJECT!,
        VAPID_PUBLIC_KEY!,
        VAPID_PRIVATE_KEY!,
      );
    } else {
      this.logger.warn('VAPID non configuré : rappels par email uniquement');
    }
  }

  // Tous les jours à 8h. Désactivé sauf si REMINDERS_ENABLED=true (lu à chaque run)
  @Cron('0 8 * * *')
  async runDaily(): Promise<void> {
    if (process.env.REMINDERS_ENABLED !== 'true') {
      this.logger.log('Rappels désactivés (REMINDERS_ENABLED)');
      return;
    }
    await this.sendDueReminders();
  }

  // Notifie les échéances qui tombent exactement à J-<leadDay>
  // pour chaque délai configuré par l'utilisateur
  async sendDueReminders(): Promise<void> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const maxLeadDays = 60;
    const horizon = new Date(today);
    horizon.setUTCDate(horizon.getUTCDate() + maxLeadDays + 1);

    const events = await this.prisma.healthEvent.findMany({
      where: { nextDueDate: { gte: today, lt: horizon } },
      include: {
        animal: {
          include: {
            owner: {
              select: {
                email: true,
                reminderLeadDays: true,
                pushSubscriptions: true,
              },
            },
          },
        },
      },
    });

    const byOwner = new Map<string, OwnerReminders>();
    for (const event of events) {
      const dueDate = new Date(event.nextDueDate as Date);
      dueDate.setUTCHours(0, 0, 0, 0);
      const daysUntil = Math.round(
        (dueDate.getTime() - today.getTime()) / 86_400_000,
      );
      const owner = event.animal.owner;
      if (!owner.reminderLeadDays.includes(daysUntil)) continue;

      const when =
        daysUntil === 0
          ? "aujourd'hui"
          : `dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
      const entry = byOwner.get(owner.email) ?? {
        email: owner.email,
        subscriptions: owner.pushSubscriptions,
        reminders: [],
      };
      entry.reminders.push({
        animalId: event.animalId,
        animal: event.animal.name,
        body: `${event.title} ${when}`,
      });
      byOwner.set(owner.email, entry);
    }

    for (const { email, subscriptions, reminders } of byOwner.values()) {
      if (this.pushEnabled) {
        for (const r of reminders) {
          const payload = JSON.stringify({
            title: `Rappel santé — ${r.animal}`,
            body: r.body,
            url: `/animals/${r.animalId}`,
          });
          for (const s of subscriptions) await this.push(s, payload);
        }
      }
      try {
        await this.mail.sendReminderDigest(
          email,
          reminders.map((r) => `${r.animal} — ${r.body}`),
        );
      } catch (e) {
        this.logger.error('Envoi email de rappel impossible', e as Error);
      }
    }
    if (byOwner.size > 0) {
      this.logger.log(`Rappels envoyés à ${byOwner.size} propriétaire(s)`);
    }
  }

  private async push(s: Subscription, payload: string): Promise<void> {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { timeout: 10_000 },
      );
    } catch (e) {
      const statusCode = (e as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await this.prisma.pushSubscription
          .delete({ where: { id: s.id } })
          .catch(() => undefined);
      } else {
        this.logger.error('Envoi Web Push impossible', e as Error);
      }
    }
  }
}
