import { z } from 'zod';

import { OTHER_SPECIES, SPECIES } from '@/lib/animals';
import { isFutureDate } from '@/lib/dates';

export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Email requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: z.string().trim().min(1, 'Email requis'),
    // Les deux contraintes sont chaînées : zod signale la première qui échoue,
    // donc « requis » sur un champ vide et la règle de longueur ensuite.
    password: z
      .string()
      .min(1, 'Mot de passe requis')
      .min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

export const animalSchema = z
  .object({
    name: z.string().trim().min(1, 'Nom requis'),
    speciesChoice: z.enum(SPECIES),
    speciesOther: z.string(),
    birthDate: z.string().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.speciesChoice === OTHER_SPECIES && !values.speciesOther.trim()) {
      ctx.addIssue({ code: 'custom', path: ['speciesOther'], message: 'Espèce requise' });
    }
    // Le sélecteur borne déjà la saisie via `maximumDate` ; ce garde-fou couvre
    // l'édition d'une fiche dont la date viendrait d'ailleurs.
    if (values.birthDate && isFutureDate(values.birthDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['birthDate'],
        message: 'La date de naissance ne peut pas être dans le futur',
      });
    }
  });

export type AnimalValues = z.infer<typeof animalSchema>;

export const healthEventSchema = z.object({
  type: z.enum(['VACCINE', 'TREATMENT', 'VISIT']),
  title: z.string().trim().min(1, 'Titre requis'),
  date: z.string().min(1, 'Date requise'),
  dosage: z.string(),
  vet: z.string(),
  notes: z.string(),
  nextDueDate: z.string().nullable(),
});

export type HealthEventValues = z.infer<typeof healthEventSchema>;
