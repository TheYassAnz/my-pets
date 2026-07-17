import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Un token Expo identifie un appareil : s'il change de compte
  // (déconnexion/reconnexion), on le rattache au nouvel utilisateur
  async registerToken(userId: string, token: string) {
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { token, userId },
      update: { userId },
    });
    return { ok: true };
  }

  async removeToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
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
