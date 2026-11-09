import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  details?: { error?: string };
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Tous les jours à 8h : notifie les échéances qui tombent exactement
  // à J-<leadDay> pour chaque délai configuré par l'utilisateur
  @Cron('0 8 * * *')
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
              select: { reminderLeadDays: true, pushSubscriptions: true },
            },
          },
        },
      },
    });

    const messages: ExpoPushMessage[] = [];
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
      for (const pushToken of owner.pushSubscriptions) {
        messages.push({
          to: pushToken.endpoint,
          title: `Rappel santé — ${event.animal.name}`,
          body: `${event.title} ${when}`,
          data: { animalId: event.animalId, eventId: event.id },
        });
      }
    }

    if (messages.length === 0) return;
    await this.sendPushMessages(messages);
    this.logger.log(`${messages.length} rappel(s) envoyé(s)`);
  }

  private async sendPushMessages(messages: ExpoPushMessage[]): Promise<void> {
    // L'API push Expo accepte 100 messages max par requête
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });
        if (!response.ok) {
          this.logger.error(`Expo push HTTP ${response.status}`);
          continue;
        }
        const { data } = (await response.json()) as { data: ExpoPushTicket[] };
        await this.cleanupInvalidTokens(chunk, data);
      } catch (e) {
        this.logger.error('Envoi push Expo impossible', e as Error);
      }
    }
  }

  private async cleanupInvalidTokens(
    chunk: ExpoPushMessage[],
    tickets: ExpoPushTicket[],
  ): Promise<void> {
    const invalid = chunk
      .filter((_, i) => tickets[i]?.details?.error === 'DeviceNotRegistered')
      .map((m) => m.to);
    if (invalid.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: invalid } },
      });
    }
  }
}
