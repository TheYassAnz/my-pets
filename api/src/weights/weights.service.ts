import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WeightsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByAnimal(ownerId: string, animalId: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, ownerId },
    });
    if (!animal) throw new NotFoundException('Animal non trouvé');

    return this.prisma.weightRecord.findMany({
      where: { animalId },
      orderBy: { date: 'desc' },
    });
  }

  async addWeight(ownerId: string, animalId: string, weightKg: number, date?: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, ownerId },
    });
    if (!animal) throw new NotFoundException('Animal non trouvé');

    return this.prisma.weightRecord.create({
      data: {
        animalId,
        weightKg,
        date: date ? new Date(date) : new Date(),
      },
    });
  }
}
