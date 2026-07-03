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

  findAll(ownerId: string) {
    return this.prisma.animal.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const animal = await this.prisma.animal.findUnique({ where: { id } });
    this.assertOwned(animal, ownerId);
    return animal;
  }

  create(ownerId: string, dto: CreateAnimalDto) {
    return this.prisma.animal.create({
      data: {
        name: dto.name,
        species: dto.species,
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
