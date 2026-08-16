import { HealthEventsService } from './health-events.service';
import { PrismaService } from '../prisma.service';

type FindManyEvent = {
  id: string;
  type: string;
  title: string;
  date: Date;
  nextDueDate: Date;
  animal: { id: string; name: string };
};

type FindManyArgs = {
  where: { nextDueDate: { gte: Date; lte: Date }; animal: { ownerId: string } };
  orderBy: { nextDueDate: 'asc' };
};

describe('HealthEventsService.findUpcoming', () => {
  it("filtre par propriétaire, trie par échéance et aplatit le nom de l'animal", async () => {
    const findMany = jest
      .fn<Promise<FindManyEvent[]>, [FindManyArgs]>()
      .mockResolvedValue([
        {
          id: 'evt-1',
          type: 'VACCINE',
          title: 'Rappel CHPL',
          date: new Date('2026-01-01'),
          nextDueDate: new Date('2026-02-01'),
          animal: { id: 'animal-1', name: 'Nala' },
        },
      ]);
    const prisma = {
      healthEvent: { findMany },
    } as unknown as PrismaService;
    const service = new HealthEventsService(prisma);

    const result = await service.findUpcoming('owner-1', 90);

    const { where, orderBy } = findMany.mock.calls[0][0];
    expect(where.animal).toEqual({ ownerId: 'owner-1' });
    expect(orderBy).toEqual({ nextDueDate: 'asc' });
    expect(result).toEqual([
      {
        id: 'evt-1',
        type: 'VACCINE',
        title: 'Rappel CHPL',
        date: new Date('2026-01-01'),
        nextDueDate: new Date('2026-02-01'),
        animalId: 'animal-1',
        animalName: 'Nala',
      },
    ]);
  });

  it("borne la fenêtre à aujourd'hui (minuit UTC) + N jours", async () => {
    const findMany = jest
      .fn<Promise<FindManyEvent[]>, [FindManyArgs]>()
      .mockResolvedValue([]);
    const prisma = { healthEvent: { findMany } } as unknown as PrismaService;
    const service = new HealthEventsService(prisma);

    await service.findUpcoming('owner-1', 30);

    const { where } = findMany.mock.calls[0][0];
    const { gte, lte } = where.nextDueDate;

    expect(gte.getUTCHours()).toBe(0);
    const daysBetween = Math.round(
      (lte.getTime() - gte.getTime()) / 86_400_000,
    );
    expect(daysBetween).toBe(30);
  });
});
