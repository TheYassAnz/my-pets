import { computeAge, resolveSpecies, splitSpecies } from '@/lib/animals';

describe('splitSpecies', () => {
  it('reconnaît une espèce de la liste fermée', () => {
    expect(splitSpecies('Chat')).toEqual({ choice: 'Chat', other: '' });
  });

  it('bascule sur « Autre » pour une valeur hors liste', () => {
    // Couvre aussi bien une espèce précisée via « Autre » qu'une ancienne
    // saisie en texte libre : la fiche reste affichable (PET-1).
    expect(splitSpecies('Furet')).toEqual({ choice: 'Autre', other: 'Furet' });
  });

  it('ne confond pas une casse différente avec l’espèce connue', () => {
    expect(splitSpecies('chien')).toEqual({ choice: 'Autre', other: 'chien' });
  });
});

describe('resolveSpecies', () => {
  it('renvoie le choix de la liste tel quel', () => {
    expect(resolveSpecies({ choice: 'Lapin', other: 'ignoré' })).toBe('Lapin');
  });

  it('renvoie le texte de précision quand le choix est « Autre »', () => {
    expect(resolveSpecies({ choice: 'Autre', other: '  Cheval  ' })).toBe('Cheval');
  });
});

describe('computeAge', () => {
  const today = new Date(2026, 6, 28);

  it('rend un âge en années au-delà de deux ans', () => {
    expect(computeAge('2023-07-28', today)).toBe('3 ans');
  });

  it('rend un âge en mois en dessous de deux ans', () => {
    expect(computeAge('2025-11-28', today)).toBe('8 mois');
  });

  it('gère le mois entamé mais pas terminé', () => {
    expect(computeAge('2026-06-29', today)).toBe("moins d'un mois");
  });

  it('ne rend pas d’âge pour une date de naissance future', () => {
    expect(computeAge('2027-01-01', today)).toBeNull();
  });

  it('ne rend pas d’âge pour une valeur non parsable', () => {
    expect(computeAge('bancal', today)).toBeNull();
  });
});
