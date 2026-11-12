import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateHealthEventDto } from './dto/create-health-event.dto';
import { UpdateHealthEventDto } from './dto/update-health-event.dto';
import { upcomingDate } from './upcoming-date';

@Injectable()
export class HealthEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string, animalId: string) {
    await this.assertAnimalOwned(ownerId, animalId);
    return this.prisma.healthEvent.findMany({
      where: { animalId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(ownerId: string, animalId: string, id: string) {
    await this.assertAnimalOwned(ownerId, animalId);
    return this.getOwnedEvent(animalId, id);
  }

  async create(ownerId: string, animalId: string, dto: CreateHealthEventDto) {
    await this.assertAnimalOwned(ownerId, animalId);
    return this.prisma.healthEvent.create({
      data: {
        type: dto.type,
        title: dto.title,
        date: new Date(dto.date),
        dosage: dto.dosage,
        vet: dto.vet,
        notes: dto.notes,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
        animalId,
      },
    });
  }

  async update(
    ownerId: string,
    animalId: string,
    id: string,
    dto: UpdateHealthEventDto,
  ) {
    await this.assertAnimalOwned(ownerId, animalId);
    await this.getOwnedEvent(animalId, id);
    return this.prisma.healthEvent.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        date: dto.date ? new Date(dto.date) : undefined,
        dosage: dto.dosage,
        vet: dto.vet,
        notes: dto.notes,
        // null vide le champ, undefined le laisse inchangé
        nextDueDate:
          dto.nextDueDate === null
            ? null
            : dto.nextDueDate
              ? new Date(dto.nextDueDate)
              : undefined,
      },
    });
  }

  async remove(ownerId: string, animalId: string, id: string): Promise<void> {
    await this.assertAnimalOwned(ownerId, animalId);
    await this.getOwnedEvent(animalId, id);
    await this.prisma.healthEvent.delete({ where: { id } });
  }

  // Toutes espèces confondues, pour l'écran d'accueil — une seule requête,
  // jamais un N+1 animal par animal.
  async findUpcoming(ownerId: string, days: number) {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const horizon = new Date(now);
    horizon.setUTCDate(horizon.getUTCDate() + days);

    // Un événement planifié (date future) compte autant qu'une prochaine échéance.
    const window = { gte: now, lte: horizon };
    const events = await this.prisma.healthEvent.findMany({
      where: {
        OR: [{ nextDueDate: window }, { date: window }],
        animal: { ownerId },
      },
      include: { animal: { select: { id: true, name: true } } },
    });

    return events
      .flatMap((event) => {
        const dueDate = upcomingDate(event, now, horizon);
        if (!dueDate) return [];
        return [
          {
            id: event.id,
            type: event.type,
            title: event.title,
            date: event.date,
            nextDueDate: event.nextDueDate,
            dueDate,
            animalId: event.animal.id,
            animalName: event.animal.name,
          },
        ];
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  // L'animal doit exister ET appartenir à l'utilisateur — sinon on ne révèle rien
  private async assertAnimalOwned(ownerId: string, animalId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });
    if (!animal) {
      throw new NotFoundException('Animal introuvable');
    }
    if (animal.ownerId !== ownerId) {
      throw new ForbiddenException();
    }
  }

  // L'événement doit exister ET être rattaché à cet animal
  private async getOwnedEvent(animalId: string, id: string) {
    const event = await this.prisma.healthEvent.findUnique({ where: { id } });
    if (!event || event.animalId !== animalId) {
      throw new NotFoundException('Événement introuvable');
    }
    return event;
  }
}
