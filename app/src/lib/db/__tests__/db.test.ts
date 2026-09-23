import { animalsCollection, database } from '../index';

describe('WatermelonDB Database', () => {
  it('instancie correctement la base de données et les collections', () => {
    expect(database).toBeDefined();
    expect(animalsCollection).toBeDefined();
    expect(animalsCollection.table).toBe('animals');
  });

  it('permet de créer et lire un animal dans la base locale', async () => {
    let createdId = '';
    await database.write(async () => {
      const animal = await animalsCollection.create((rec) => {
        rec.name = 'Pilou';
        rec.species = 'Chien';
        rec.breed = 'Golden Retriever';
        rec.isSterilized = true;
        rec.ownerId = 'owner-1';
      });
      createdId = animal.id;
    });

    expect(createdId).toBeTruthy();
    const fetched = await animalsCollection.find(createdId);
    expect(fetched.name).toBe('Pilou');
    expect(fetched.species).toBe('Chien');
    expect(fetched.isSterilized).toBe(true);
  });
});
