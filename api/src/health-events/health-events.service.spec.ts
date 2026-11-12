import { HealthEventsService } from './health-events.service';
import { PrismaService } from '../prisma.service';

type FindManyEvent = {
  id: string;
  type: string;
  title: string;
  date: Date;
  nextDueDate: Date | null;
  animal: { id: string; name: string };
};

type UpdateArgs = { data: Record<string, unknown> };
type Window = { gte: Date; lte: Date };
type FindManyArgs = {
  where: {
    OR: [{ nextDueDate: Window }, { date: Window }];
    animal: { ownerId: string };
  };
};

describe('HealthEventsService.findUpcoming', () => {
  const inDays = (n: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() + n * 86_400_000);
  };

  it("filtre par propriétaire, trie par date à venir et aplatit le nom de l'animal", async () => {
    const findMany = jest
      .fn<Promise<FindManyEvent[]>, [FindManyArgs]>()
      .mockResolvedValue([
        {
          id: 'evt-1',
          type: 'VACCINE',
          title: 'Rappel CHPL',
          date: inDays(-300),
          nextDueDate: inDays(30),
          animal: { id: 'animal-1', name: 'Nala' },
        },
        {
          id: 'evt-2',
          type: 'VISIT',
          title: 'Contrôle',
          date: inDays(17),
          nextDueDate: null,
          animal: { id: 'animal-2', name: 'Proxima' },
        },
      ]);
    const prisma = {
      healthEvent: { findMany },
    } as unknown as PrismaService;
    const service = new HealthEventsService(prisma);

    const result = await service.findUpcoming('owner-1', 90);

    const { where } = findMany.mock.calls[0][0];
    expect(where.animal).toEqual({ ownerId: 'owner-1' });
    expect(result).toEqual([
      {
        id: 'evt-2',
        type: 'VISIT',
        title: 'Contrôle',
        date: inDays(17),
        nextDueDate: null,
        dueDate: inDays(17),
        animalId: 'animal-2',
        animalName: 'Proxima',
      },
      {
        id: 'evt-1',
        type: 'VACCINE',
        title: 'Rappel CHPL',
        date: inDays(-300),
        nextDueDate: inDays(30),
        dueDate: inDays(30),
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
    // Une date planifiée OU une prochaine échéance dans la même fenêtre
    expect(where.OR[1].date).toBe(where.OR[0].nextDueDate);
    const { gte, lte } = where.OR[0].nextDueDate;

    expect(gte.getUTCHours()).toBe(0);
    const daysBetween = Math.round(
      (lte.getTime() - gte.getTime()) / 86_400_000,
    );
    expect(daysBetween).toBe(30);
  });
});

describe('HealthEventsService.update', () => {
  const buildService = () => {
    const updateMock = jest.fn().mockResolvedValue({});
    const prisma = {
      animal: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'animal-1', ownerId: 'owner-1' }),
      },
      healthEvent: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'evt-1', animalId: 'animal-1' }),
        update: updateMock,
      },
    } as unknown as PrismaService;
    return { service: new HealthEventsService(prisma), updateMock };
  };

  it('envoie null pour vider un champ optionnel', async () => {
    const { service, updateMock } = buildService();

    await service.update('owner-1', 'animal-1', 'evt-1', {
      nextDueDate: null,
      notes: null,
    });

    const [{ data }] = updateMock.mock.calls[0] as [UpdateArgs];
    expect(data.nextDueDate).toBeNull();
    expect(data.notes).toBeNull();
  });

  it('laisse inchangés les champs absents (undefined)', async () => {
    const { service, updateMock } = buildService();

    await service.update('owner-1', 'animal-1', 'evt-1', { title: 'x' });

    const [{ data }] = updateMock.mock.calls[0] as [UpdateArgs];
    expect(data.nextDueDate).toBeUndefined();
    expect(data.notes).toBeUndefined();
    expect(data.dosage).toBeUndefined();
    expect(data.vet).toBeUndefined();
  });
});
