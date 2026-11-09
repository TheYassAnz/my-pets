import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Un endpoint identifie un appareil : s'il change de compte
  // (déconnexion/reconnexion), on le rattache au nouvel utilisateur
  async saveSubscription(
    userId: string,
    sub: { endpoint: string; p256dh: string; auth: string },
  ) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: { ...sub, userId },
      update: { p256dh: sub.p256dh, auth: sub.auth, userId },
    });
    return { ok: true };
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { reminderLeadDays: true },
    });
    return { leadDays: user.reminderLeadDays };
  }

  async updateSettings(userId: string, leadDays: number[]) {
    const unique = [...new Set(leadDays)].sort((a, b) => b - a);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { reminderLeadDays: unique },
      select: { reminderLeadDays: true },
    });
    return { leadDays: user.reminderLeadDays };
  }
}
