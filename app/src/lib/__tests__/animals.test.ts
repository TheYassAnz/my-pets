import { computeAge, formatKg, resolveSpecies, splitSpecies } from '@/lib/animals';

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

describe('formatKg', () => {
  it('formate avec virgule décimale', () => {
    expect(formatKg(4.2)).toBe('4,2 kg');
    expect(formatKg(12)).toBe('12 kg');
  });

  it('arrondit à 1 décimale sans artefact flottant', () => {
    expect(formatKg(0.1 + 0.2)).toBe('0,3 kg');
    expect(formatKg(4.25)).toBe('4,3 kg');
    expect(formatKg(5)).toBe('5 kg');
    expect(formatKg(18.65)).toBe('18,7 kg');
  });

  it('renvoie un tiret sans poids', () => {
    expect(formatKg(null)).toBe('—');
    expect(formatKg(undefined)).toBe('—');
  });
});
