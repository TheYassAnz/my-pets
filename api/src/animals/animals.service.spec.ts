import { AnimalsService } from './animals.service';
import { PrismaService } from '../prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

describe('AnimalsService.findAll', () => {
  it('enrichit chaque animal avec eventCount et nextDueDate via groupBy, sans requête par animal', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'animal-1', name: 'Nala', ownerId: 'owner-1' },
      { id: 'animal-2', name: 'Miko', ownerId: 'owner-1' },
    ]);
    const groupBy = jest
      .fn()
      // premier appel : comptage total par animal
      .mockResolvedValueOnce([
        { animalId: 'animal-1', _count: { _all: 3 } },
        { animalId: 'animal-2', _count: { _all: 1 } },
      ])
      // second appel : prochaine échéance par animal
      .mockResolvedValueOnce([
        { animalId: 'animal-1', _min: { nextDueDate: new Date('2026-03-01') } },
      ]);
    const prisma = {
      animal: { findMany },
      healthEvent: { groupBy },
    } as unknown as PrismaService;
    const service = new AnimalsService(
      prisma,
      {} as unknown as SupabaseStorageService,
    );

    const result = await service.findAll('owner-1');

    expect(groupBy).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      {
        id: 'animal-1',
        name: 'Nala',
        ownerId: 'owner-1',
        latestWeight: null,
        eventCount: 3,
        nextDueDate: new Date('2026-03-01'),
      },
      {
        id: 'animal-2',
        name: 'Miko',
        ownerId: 'owner-1',
        latestWeight: null,
        eventCount: 1,
        nextDueDate: null,
      },
    ]);
  });

  it("court-circuite les groupBy quand l'utilisateur n'a aucun animal", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const groupBy = jest.fn();
    const prisma = {
      animal: { findMany },
      healthEvent: { groupBy },
    } as unknown as PrismaService;
    const service = new AnimalsService(
      prisma,
      {} as unknown as SupabaseStorageService,
    );

    const result = await service.findAll('owner-1');

    expect(result).toEqual([]);
    expect(groupBy).not.toHaveBeenCalled();
  });
});
