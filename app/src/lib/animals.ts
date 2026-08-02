import { parseIsoDate } from './dates';

export const OTHER_SPECIES = 'Autre';

// Liste fermée exigée par PET-1. `Autre` reste ouvert pour ne pas bloquer
// les cas rares (furet, cheval…), précisés dans un champ texte.
export const SPECIES = [
  'Chien',
  'Chat',
  'Lapin',
  'Oiseau',
  'Rongeur',
  'Reptile',
  OTHER_SPECIES,
] as const;

export type Species = (typeof SPECIES)[number];

export type SpeciesSelection = {
  choice: Species;
  other: string;
};

// La base ne stocke qu'une chaîne : une valeur hors liste (ancienne saisie libre,
// ou espèce précisée via « Autre ») revient donc sur « Autre » + texte.
export function splitSpecies(stored: string): SpeciesSelection {
  const known = SPECIES.find((s) => s !== OTHER_SPECIES && s === stored);
  if (known) return { choice: known, other: '' };
  return { choice: OTHER_SPECIES, other: stored };
}

export function resolveSpecies(selection: SpeciesSelection): string {
  return selection.choice === OTHER_SPECIES ? selection.other.trim() : selection.choice;
}

// PET-8 : « 3 ans » / « 8 mois » sur la fiche animal.
export function computeAge(birthDateIso: string, today: Date = new Date()): string | null {
  const birth = parseIsoDate(birthDateIso);
  if (!birth) return null;
  if (birth.getTime() > today.getTime()) return null;

  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months -= 1;

  if (months < 1) return "moins d'un mois";
  if (months < 24) return `${months} mois`;
  return `${Math.floor(months / 12)} ans`;
}
