import { formatLongDate, isFutureDate, parseIsoDate, toIsoDate } from '@/lib/dates';

describe('parseIsoDate', () => {
  it('interprète la date en heure locale, pas en UTC', () => {
    // `new Date('2026-03-12')` donnerait minuit UTC : dans un fuseau négatif,
    // la date locale reculerait au 11 mars.
    const date = parseIsoDate('2026-03-12');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(12);
  });

  it('accepte une date ISO complète en ne gardant que le jour', () => {
    expect(parseIsoDate('2026-03-12T22:30:00.000Z')?.getDate()).toBe(12);
  });

  it('renvoie null sur une valeur non parsable', () => {
    expect(parseIsoDate('pas une date')).toBeNull();
  });
});

describe('toIsoDate', () => {
  it('sérialise en AAAA-MM-JJ avec le remplissage à deux chiffres', () => {
    expect(toIsoDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('fait un aller-retour sans décalage de jour', () => {
    const iso = '2026-01-01';

    expect(toIsoDate(parseIsoDate(iso) as Date)).toBe(iso);
  });
});

describe('formatLongDate', () => {
  it('rend le format long français attendu par PET-5', () => {
    expect(formatLongDate('2026-03-12')).toBe('12 mars 2026');
  });

  it('retourne la valeur brute si elle n’est pas parsable', () => {
    expect(formatLongDate('bancal')).toBe('bancal');
  });
});

describe('isFutureDate', () => {
  const today = new Date(2026, 6, 28);

  it('détecte une date postérieure à aujourd’hui', () => {
    expect(isFutureDate('2026-07-29', today)).toBe(true);
  });

  it('ne considère pas aujourd’hui comme futur', () => {
    expect(isFutureDate('2026-07-28', today)).toBe(false);
  });

  it('ne considère pas le passé comme futur', () => {
    expect(isFutureDate('2020-01-01', today)).toBe(false);
  });
});
