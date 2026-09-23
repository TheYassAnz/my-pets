import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  private getTodayBounds() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async getTodayTasks(ownerId: string) {
    const { start, end } = this.getTodayBounds();

    const routines = await this.prisma.routine.findMany({
      where: {
        animal: { ownerId },
      },
      include: {
        animal: { select: { id: true, name: true } },
        taskLogs: {
          where: {
            date: { gte: start, lte: end },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return routines.map((r) => {
      const todayLog = r.taskLogs[0];
      return {
        id: r.id,
        routineId: r.id,
        title: r.title,
        subtitle: r.description ?? '',
        animal: r.animal.name,
        animalId: r.animal.id,
        checked: todayLog ? todayLog.isDone : false,
        doneBy: todayLog?.doneBy ?? null,
      };
    });
  }

  async toggleTask(ownerId: string, routineId: string, userName = 'Camille') {
    const { start, end } = this.getTodayBounds();

    const routine = await this.prisma.routine.findFirst({
      where: {
        id: routineId,
        animal: { ownerId },
      },
    });

    if (!routine) throw new NotFoundException('Routine non trouvée');

    const existingLog = await this.prisma.taskLog.findFirst({
      where: {
        routineId,
        date: { gte: start, lte: end },
      },
    });

    if (existingLog) {
      return this.prisma.taskLog.update({
        where: { id: existingLog.id },
        data: {
          isDone: !existingLog.isDone,
          doneBy: !existingLog.isDone ? userName : null,
        },
      });
    }

    return this.prisma.taskLog.create({
      data: {
        routineId,
        date: new Date(),
        isDone: true,
        doneBy: userName,
      },
    });
  }

  async findAll(ownerId: string) {
    return this.prisma.routine.findMany({
      where: {
        animal: { ownerId },
      },
      include: {
        animal: { select: { id: true, name: true } },
        taskLogs: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, data: { title: string; description?: string; frequency: string; animalId: string }) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: data.animalId, ownerId },
    });
    if (!animal) throw new NotFoundException('Animal non trouvé');

    return this.prisma.routine.create({
      data: {
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        animalId: data.animalId,
      },
    });
  }
}
