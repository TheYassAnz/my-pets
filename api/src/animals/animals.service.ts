import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';

@Injectable()
export class AnimalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async findAll(ownerId: string) {
    const animals = await this.prisma.animal.findMany({
      where: { ownerId },
      include: {
        weightRecords: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (animals.length === 0) return [];

    const animalIds = animals.map((animal) => animal.id);

    const [counts, upcoming] = await Promise.all([
      this.prisma.healthEvent.groupBy({
        by: ['animalId'],
        where: { animalId: { in: animalIds } },
        _count: { _all: true },
      }),
      this.prisma.healthEvent.groupBy({
        by: ['animalId'],
        where: {
          animalId: { in: animalIds },
          nextDueDate: { gte: new Date() },
        },
        _min: { nextDueDate: true },
      }),
    ]);

    const eventCountByAnimal = new Map(
      counts.map((c) => [c.animalId, c._count._all]),
    );
    const nextDueDateByAnimal = new Map(
      upcoming.map((u) => [u.animalId, u._min.nextDueDate]),
    );

    return animals.map((animal) => ({
      ...animal,
      latestWeight: (animal as any).weightRecords?.[0]?.weightKg ?? null,
      eventCount: eventCountByAnimal.get(animal.id) ?? 0,
      nextDueDate: nextDueDateByAnimal.get(animal.id) ?? null,
    }));
  }

  async findOne(ownerId: string, id: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      include: {
        weightRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        documents: true,
      },
    });
    this.assertOwned(animal, ownerId);
    return {
      ...animal,
      latestWeight: animal.weightRecords[0]?.weightKg ?? null,
    };
  }

  create(ownerId: string, dto: CreateAnimalDto) {
    return this.prisma.animal.create({
      data: {
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        gender: dto.gender,
        isSterilized: dto.isSterilized ?? false,
        dailyRation: dto.dailyRation,
        foodBrand: dto.foodBrand,
        foodStockKg: dto.foodStockKg,
        foodTotalKg: dto.foodTotalKg,
        foodOpenedAt: dto.foodOpenedAt ? new Date(dto.foodOpenedAt) : undefined,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        ownerId,
      },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateAnimalDto) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    this.assertOwned(animal, ownerId);

    return this.prisma.animal.update({
      where: { id },
      data: {
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        gender: dto.gender,
        isSterilized: dto.isSterilized,
        dailyRation: dto.dailyRation,
        foodBrand: dto.foodBrand,
        foodStockKg: dto.foodStockKg,
        foodTotalKg: dto.foodTotalKg,
        foodOpenedAt: dto.foodOpenedAt ? new Date(dto.foodOpenedAt) : undefined,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    this.assertOwned(animal, ownerId);
    await this.prisma.animal.delete({ where: { id } });
  }

  async uploadPhoto(
    ownerId: string,
    id: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    this.assertOwned(animal, ownerId);

    const photoUrl = await this.storage.uploadAnimalPhoto(ownerId, file);
    return this.prisma.animal.update({ where: { id }, data: { photoUrl } });
  }

  private assertOwned(
    animal: { ownerId: string } | null,
    ownerId: string,
  ): asserts animal is NonNullable<typeof animal> {
    if (!animal) {
      throw new NotFoundException('Animal introuvable');
    }
    if (animal.ownerId !== ownerId) {
      throw new ForbiddenException();
    }
  }
}
