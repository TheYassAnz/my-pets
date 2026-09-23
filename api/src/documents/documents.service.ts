import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string, animalId?: string, category?: string) {
    const where: any = { ownerId };
    if (animalId) where.animalId = animalId;
    if (category && category !== 'Tous') where.category = category;

    return this.prisma.document.findMany({
      where,
      include: {
        animal: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    ownerId: string,
    data: { title: string; category?: string; fileUrl?: string; fileSize?: string; animalId?: string },
  ) {
    return this.prisma.document.create({
      data: {
        ownerId,
        title: data.title,
        category: data.category ?? 'Carnets',
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? '2.4 Mo',
        animalId: data.animalId,
      },
    });
  }

  async remove(ownerId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, ownerId },
    });
    if (!doc) throw new NotFoundException('Document non trouvé');

    return this.prisma.document.delete({ where: { id } });
  }
}
