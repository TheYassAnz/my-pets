import { PrismaClient, Gender, HealthEventType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Museau mock data...');

  // 1. Utilisateur Camille
  const email = 'camille.roux@mail.fr';
  const hashedPassword = await argon2.hash('Password123!');

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        reminderLeadDays: [15, 1],
        preferredVet: 'Dr Vasseur — Clinique des Lilas',
        preferredVetPhone: '04 78 22 41 09',
        preferredVetAddress: '14 rue des Lilas, Lyon 3e',
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        preferredVet: 'Dr Vasseur — Clinique des Lilas',
        preferredVetPhone: '04 78 22 41 09',
        preferredVetAddress: '14 rue des Lilas, Lyon 3e',
      },
    });
  }

  // 2. Membre du foyer Léa
  const existingLea = await prisma.householdMember.findFirst({
    where: { userId: user.id, name: 'Léa' },
  });
  if (!existingLea) {
    await prisma.householdMember.create({
      data: {
        userId: user.id,
        name: 'Léa',
        role: 'Peut modifier',
      },
    });
  }

  // Nettoyage des animaux existants de cet utilisateur pour éviter les doublons lors des re-seed
  await prisma.animal.deleteMany({ where: { ownerId: user.id } });

  // 3. Pilou (Chien)
  const pilou = await prisma.animal.create({
    data: {
      name: 'Pilou',
      species: 'Chien',
      breed: 'Berger australien',
      gender: Gender.MALE,
      isSterilized: true,
      dailyRation: '340 g',
      foodBrand: 'Croquettes adulte agneau',
      foodStockKg: 6.5,
      foodTotalKg: 12.0,
      foodOpenedAt: new Date('2026-08-20'),
      birthDate: new Date('2019-09-10'),
      ownerId: user.id,
    },
  });

  // Pesées de Pilou (6 derniers mois)
  const pilouWeights = [
    { weightKg: 17.7, date: new Date('2026-07-14') },
    { weightKg: 17.8, date: new Date('2026-07-28') },
    { weightKg: 17.9, date: new Date('2026-08-11') },
    { weightKg: 18.0, date: new Date('2026-08-25') },
    { weightKg: 18.2, date: new Date('2026-09-08') },
  ];
  for (const w of pilouWeights) {
    await prisma.weightRecord.create({
      data: { animalId: pilou.id, weightKg: w.weightKg, date: w.date },
    });
  }

  // Routines de Pilou
  const croquettesMatin = await prisma.routine.create({
    data: {
      animalId: pilou.id,
      title: 'Croquettes du matin',
      description: '170 g · fait par Léa',
      frequency: 'DAILY',
    },
  });
  // Log d'aujourd'hui déjà fait
  await prisma.taskLog.create({
    data: {
      routineId: croquettesMatin.id,
      date: new Date(),
      isDone: true,
      doneBy: 'Léa',
    },
  });

  await prisma.routine.create({
    data: {
      animalId: pilou.id,
      title: 'Vermifuge du mois',
      description: 'Milbemax · 1 comprimé',
      frequency: 'MONTHLY',
    },
  });

  await prisma.routine.create({
    data: {
      animalId: pilou.id,
      title: 'Complément articulaire',
      description: 'Pilou · en pause depuis juin',
      frequency: 'DAILY',
    },
  });

  // Événements de santé de Pilou
  await prisma.healthEvent.create({
    data: {
      animalId: pilou.id,
      type: HealthEventType.VACCINE,
      title: 'Rappel vaccin CHPL',
      date: new Date('2025-09-14'),
      nextDueDate: new Date('2026-09-14T09:30:00'),
      vet: 'Dr Vasseur',
      notes: 'Apporter le carnet papier',
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: pilou.id,
      type: HealthEventType.VACCINE,
      title: 'Rage',
      date: new Date('2026-03-03'),
      nextDueDate: new Date('2027-03-03'),
      vet: 'Dr Vasseur',
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: pilou.id,
      type: HealthEventType.VACCINE,
      title: 'Leptospirose',
      date: new Date('2026-03-03'),
      nextDueDate: new Date('2027-03-03'),
      vet: 'Dr Vasseur',
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: pilou.id,
      type: HealthEventType.VACCINE,
      title: 'Toux du chenil',
      date: new Date('2025-11-12'),
      nextDueDate: new Date('2026-11-12'),
      vet: 'Dr Vasseur',
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: pilou.id,
      type: HealthEventType.TREATMENT,
      title: 'Antiparasitaire externe',
      date: new Date('2026-07-01'),
      nextDueDate: new Date('2026-10-01'),
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: pilou.id,
      type: HealthEventType.VISIT,
      title: 'Toilettage',
      date: new Date('2026-10-12T10:00:00'),
      nextDueDate: new Date('2026-10-12T10:00:00'),
    },
  });

  // Documents de Pilou
  await prisma.document.create({
    data: {
      ownerId: user.id,
      animalId: pilou.id,
      title: 'Carnet de santé — Pilou',
      category: 'Carnets',
      fileSize: '2.4 Mo · mis à jour le 3 mars',
    },
  });
  await prisma.document.create({
    data: {
      ownerId: user.id,
      animalId: pilou.id,
      title: "Attestation d'assurance",
      category: 'Assurance',
      fileSize: "Mutuelle Animo · valide jusqu'au 31 déc",
    },
  });

  // 4. Nala (Chat)
  const nala = await prisma.animal.create({
    data: {
      name: 'Nala',
      species: 'Chat',
      breed: 'Chat européen',
      gender: Gender.FEMALE,
      isSterilized: true,
      dailyRation: '65 g',
      birthDate: new Date('2022-04-15'),
      ownerId: user.id,
    },
  });
  await prisma.weightRecord.create({
    data: { animalId: nala.id, weightKg: 4.1, date: new Date('2026-09-01') },
  });

  await prisma.routine.create({
    data: {
      animalId: nala.id,
      title: 'Litière — changement',
      description: 'Tous les 3 jours',
      frequency: 'THREE_DAYS',
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: nala.id,
      type: HealthEventType.VISIT,
      title: 'Contrôle dentaire',
      date: new Date('2026-09-22T17:00:00'),
      nextDueDate: new Date('2026-09-22T17:00:00'),
    },
  });

  await prisma.document.create({
    data: {
      ownerId: user.id,
      animalId: nala.id,
      title: 'Ordonnance — Nala',
      category: 'Ordonnances',
      fileSize: 'PDF · 12 nov 2025',
    },
  });

  // 5. Miso (Chaton)
  const miso = await prisma.animal.create({
    data: {
      name: 'Miso',
      species: 'Chat',
      breed: 'Chartreux',
      gender: Gender.MALE,
      isSterilized: false,
      dailyRation: '80 g',
      birthDate: new Date('2025-09-01'),
      ownerId: user.id,
    },
  });
  await prisma.weightRecord.create({
    data: { animalId: miso.id, weightKg: 3.4, date: new Date('2026-09-05') },
  });

  await prisma.routine.create({
    data: {
      animalId: miso.id,
      title: 'Peser Miso',
      description: 'Suivi de croissance · hebdo',
      frequency: 'WEEKLY',
    },
  });

  await prisma.healthEvent.create({
    data: {
      animalId: miso.id,
      type: HealthEventType.VISIT,
      title: 'Stérilisation — bilan',
      date: new Date('2026-10-28T11:15:00'),
      nextDueDate: new Date('2026-10-28T11:15:00'),
    },
  });

  await prisma.document.create({
    data: {
      ownerId: user.id,
      animalId: miso.id,
      title: "Certificat d'identification",
      category: 'Carnets',
      fileSize: 'Photo · puce 250269…',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
