import { api } from '../api';
import {
  animalsCollection,
  database,
  documentsCollection,
  healthEventsCollection,
  routinesCollection,
  taskLogsCollection,
  weightRecordsCollection,
} from './index';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export async function syncWithServer(): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Récupération des données distantes depuis l'API
    const [animals, routines, documents] = await Promise.all([
      api.listAnimals().catch(() => null),
      api.listRoutines().catch(() => null),
      api.listDocuments().catch(() => null),
    ]);

    if (!animals) {
      return { success: false, error: 'Serveur injoignable' };
    }

    await database.write(async () => {
      // Synchronisation des animaux
      for (const a of animals) {
        let existing = null;
        try {
          existing = await animalsCollection.find(a.id);
        } catch {
          existing = null;
        }

        if (existing) {
          await existing.update((record) => {
            record.name = a.name;
            record.species = a.species;
            record.breed = a.breed ?? undefined;
            record.gender = a.gender ?? undefined;
            record.isSterilized = Boolean(a.isSterilized);
            record.dailyRation = a.dailyRation ?? undefined;
            record.foodBrand = a.foodBrand ?? undefined;
            record.foodStockKg = a.foodStockKg ?? undefined;
            record.foodTotalKg = a.foodTotalKg ?? undefined;
            record.birthDate = a.birthDate ?? undefined;
            record.photoUrl = a.photoUrl ?? undefined;
          });
        } else {
          await animalsCollection.create((record) => {
            record._raw.id = a.id;
            record.name = a.name;
            record.species = a.species;
            record.breed = a.breed ?? undefined;
            record.gender = a.gender ?? undefined;
            record.isSterilized = Boolean(a.isSterilized);
            record.dailyRation = a.dailyRation ?? undefined;
            record.foodBrand = a.foodBrand ?? undefined;
            record.foodStockKg = a.foodStockKg ?? undefined;
            record.foodTotalKg = a.foodTotalKg ?? undefined;
            record.birthDate = a.birthDate ?? undefined;
            record.photoUrl = a.photoUrl ?? undefined;
            record.ownerId = '';
          });
        }

        // Synchronisation des événements et pesées
        const [events, weights] = await Promise.all([
          api.listEvents(a.id).catch(() => []),
          api.listWeights(a.id).catch(() => []),
        ]);

        for (const ev of events) {
          let existingEv = null;
          try {
            existingEv = await healthEventsCollection.find(ev.id);
          } catch {
            existingEv = null;
          }

          if (existingEv) {
            await existingEv.update((rec) => {
              rec.type = ev.type;
              rec.title = ev.title;
              rec.date = new Date(ev.date);
              rec.dosage = ev.dosage ?? undefined;
              rec.vet = ev.vet ?? undefined;
              rec.notes = ev.notes ?? undefined;
              rec.nextDueDate = ev.nextDueDate ? new Date(ev.nextDueDate) : undefined;
            });
          } else {
            await healthEventsCollection.create((rec) => {
              rec._raw.id = ev.id;
              rec.animalId = a.id;
              rec.type = ev.type;
              rec.title = ev.title;
              rec.date = new Date(ev.date);
              rec.dosage = ev.dosage ?? undefined;
              rec.vet = ev.vet ?? undefined;
              rec.notes = ev.notes ?? undefined;
              rec.nextDueDate = ev.nextDueDate ? new Date(ev.nextDueDate) : undefined;
            });
          }
        }

        for (const w of weights) {
          let existingW = null;
          try {
            existingW = await weightRecordsCollection.find(w.id);
          } catch {
            existingW = null;
          }

          if (existingW) {
            await existingW.update((rec) => {
              rec.weightKg = w.weightKg;
              rec.date = new Date(w.date);
            });
          } else {
            await weightRecordsCollection.create((rec) => {
              rec._raw.id = w.id;
              rec.animalId = a.id;
              rec.weightKg = w.weightKg;
              rec.date = new Date(w.date);
            });
          }
        }
      }

      // Synchronisation des routines
      if (routines) {
        for (const r of routines) {
          let existingR = null;
          try {
            existingR = await routinesCollection.find(r.id);
          } catch {
            existingR = null;
          }

          if (existingR) {
            await existingR.update((rec) => {
              rec.title = r.title;
              rec.description = r.description ?? undefined;
              rec.frequency = r.frequency;
            });
          } else {
            await routinesCollection.create((rec) => {
              rec._raw.id = r.id;
              rec.animalId = r.animalId;
              rec.title = r.title;
              rec.description = r.description ?? undefined;
              rec.frequency = r.frequency;
            });
          }

          for (const tl of r.taskLogs ?? []) {
            let existingTl = null;
            try {
              existingTl = await taskLogsCollection.find(tl.id);
            } catch {
              existingTl = null;
            }

            if (existingTl) {
              await existingTl.update((rec) => {
                rec.date = tl.date;
                rec.isDone = tl.isDone;
                rec.doneBy = tl.doneBy ?? undefined;
              });
            } else {
              await taskLogsCollection.create((rec) => {
                rec._raw.id = tl.id;
                rec.routineId = r.id;
                rec.date = tl.date;
                rec.isDone = tl.isDone;
                rec.doneBy = tl.doneBy ?? undefined;
              });
            }
          }
        }
      }

      // Synchronisation des documents
      if (documents) {
        for (const doc of documents) {
          let existingDoc = null;
          try {
            existingDoc = await documentsCollection.find(doc.id);
          } catch {
            existingDoc = null;
          }

          if (existingDoc) {
            await existingDoc.update((rec) => {
              rec.title = doc.title;
              rec.category = doc.category;
              rec.fileUrl = doc.fileUrl ?? undefined;
              rec.fileSize = doc.fileSize ?? undefined;
            });
          } else {
            await documentsCollection.create((rec) => {
              rec._raw.id = doc.id;
              rec.animalId = doc.animalId ?? undefined;
              rec.title = doc.title;
              rec.category = doc.category;
              rec.fileUrl = doc.fileUrl ?? undefined;
              rec.fileSize = doc.fileSize ?? undefined;
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Erreur lors de la synchronisation' };
  }
}
