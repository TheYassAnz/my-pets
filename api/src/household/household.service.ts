import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HouseholdService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const members = await this.prisma.householdMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return [
      {
        id: 'owner',
        name: 'Camille (vous)',
        email: user?.email,
        role: 'Admin',
        isOwner: true,
      },
      ...members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        isOwner: false,
      })),
    ];
  }

  async addMember(userId: string, name: string, role = 'Peut modifier') {
    return this.prisma.householdMember.create({
      data: {
        userId,
        name,
        role,
      },
    });
  }

  async getStats(userId: string) {
    const [animalsCount, membersCount, routinesCount, upcomingEventsCount] =
      await Promise.all([
        this.prisma.animal.count({ where: { ownerId: userId } }),
        this.prisma.householdMember.count({ where: { userId } }),
        this.prisma.routine.count({ where: { animal: { ownerId: userId } } }),
        this.prisma.healthEvent.count({
          where: {
            animal: { ownerId: userId },
            nextDueDate: { gte: new Date() },
          },
        }),
      ]);

    return {
      animalsCount,
      membersCount: membersCount + 1, // inclut le propriétaire
      remindersCount: routinesCount + upcomingEventsCount,
    };
  }
}
