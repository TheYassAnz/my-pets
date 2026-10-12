import { formatKg } from '@/lib/animals';
import type { HealthEvent, WeightRecord } from '@/lib/api';
import { buildTimeline, filterTimeline, weightTrend } from '@/lib/timeline';

const ev = (o: Partial<HealthEvent> & { id: string; date: string }): HealthEvent => ({
  type: 'VACCINE',
  title: 'Rage',
  dosage: null,
  vet: null,
  notes: null,
  nextDueDate: null,
  animalId: 'a1',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...o,
});
const w = (id: string, date: string, weightKg: number): WeightRecord => ({ id, date, weightKg, animalId: 'a1' });
const ids = (t: { id: string }[]) => t.map((e) => e.id);

describe('buildTimeline — dates', () => {
  it('ISO complet : l’heure départage deux entrées du même jour', () => {
    const t = buildTimeline(
      [ev({ id: 'm', date: '2026-03-03T08:00:00.000Z' }), ev({ id: 's', date: '2026-03-03T23:30:00.000Z' })],
      [],
    );
    expect(ids(t)).toEqual(['s', 'm']);
  });

  it('formats mixtes : AAAA-MM-JJ passe après le même jour avec heure (comparaison lexicographique)', () => {
    const t = buildTimeline([ev({ id: 'short', date: '2026-03-03' })], [w('long', '2026-03-03T23:30:00.000Z', 4)]);
    // Comportement actuel épinglé : "2026-03-03T…" > "2026-03-03" donc la pesée horodatée passe devant.
    expect(ids(t)).toEqual(['long', 'short']);
  });

  it('un jour plus récent reste devant quel que soit le format', () => {
    const t = buildTimeline([ev({ id: 'a', date: '2026-03-04' })], [w('b', '2026-03-03T23:59:59.999Z', 4)]);
    expect(ids(t)).toEqual(['a', 'b']);
  });

  it('ne plante pas avec des dates vides ou invalides et conserve toutes les entrées', () => {
    const events = [ev({ id: 'e1', date: '' }), ev({ id: 'e2', date: 'pas-une-date' }), ev({ id: 'e3', date: '2026-01-01' })];
    const weights = [w('w1', '', 4), w('w2', 'n/a', 5)];
    let t: ReturnType<typeof buildTimeline> = [];
    expect(() => {
      t = buildTimeline(events, weights);
    }).not.toThrow();
    expect(ids(t).sort()).toEqual(['e1', 'e2', 'e3', 'w1', 'w2']);
  });

  it('date undefined/null (donnée API corrompue) ne plante pas', () => {
    const bad = [ev({ id: 'x', date: undefined as unknown as string }), ev({ id: 'y', date: null as unknown as string })];
    expect(() => buildTimeline(bad, [w('z', undefined as unknown as string, 4)])).not.toThrow();
  });
});

describe('buildTimeline — contenu', () => {
  it('detail : vet + dosage, chaînes vides traitées comme absentes', () => {
    const t = buildTimeline(
      [
        ev({ id: 'both', date: '2026-01-05', vet: 'Dr Roux', dosage: '2 ml' }),
        ev({ id: 'emptyvet', date: '2026-01-04', vet: '', dosage: '2 ml' }),
        ev({ id: 'emptyboth', date: '2026-01-03', vet: '', dosage: '' }),
        ev({ id: 'none', date: '2026-01-02' }),
      ],
      [],
    );
    expect(t.map((e) => e.detail)).toEqual(['Dr Roux · 2 ml', '2 ml', null, null]);
  });

  it('detail : vet blanc ("  ") est conservé tel quel (non trimé)', () => {
    const [e] = buildTimeline([ev({ id: 'a', date: '2026-01-01', vet: '  ', dosage: null })], []);
    expect(e.detail).toBe('  ');
  });

  it('pesée : poids 0, négatif et NaN passent par formatKg sans plantage', () => {
    const t = buildTimeline([], [w('a', '2026-01-03', 0), w('b', '2026-01-02', -1.5), w('c', '2026-01-01', 12)]);
    expect(t.map((e) => e.detail)).toEqual(['0 kg', '-1,5 kg', '12 kg']);
  });

  it('deux pesées le même jour : les deux sont gardées, ordre d’entrée conservé', () => {
    const t = buildTimeline([], [w('w1', '2026-02-01', 4), w('w2', '2026-02-01', 4.2)]);
    expect(ids(t)).toEqual(['w1', 'w2']);
  });

  it('les trois types d’événement gardent leur kind', () => {
    const t = buildTimeline(
      [
        ev({ id: 'v', date: '2026-01-03', type: 'VACCINE' }),
        ev({ id: 't', date: '2026-01-02', type: 'TREATMENT' }),
        ev({ id: 'x', date: '2026-01-01', type: 'VISIT' }),
      ],
      [],
    );
    expect(t.map((e) => e.kind)).toEqual(['VACCINE', 'TREATMENT', 'VISIT']);
  });

  it('1000 entrées : trié décroissant, stable à date égale, événements avant pesées', () => {
    const events: HealthEvent[] = [];
    const weights: WeightRecord[] = [];
    for (let i = 0; i < 500; i++) {
      const day = String((i % 20) + 1).padStart(2, '0');
      events.push(ev({ id: `e${i}`, date: `2026-01-${day}` }));
      weights.push(w(`w${i}`, `2026-01-${day}`, 4));
    }
    const t = buildTimeline(events, weights);
    expect(t).toHaveLength(1000);
    for (let i = 1; i < t.length; i++) {
      expect(t[i - 1].date >= t[i].date).toBe(true);
      if (t[i - 1].date === t[i].date) {
        // même jour : événements d'abord, puis ordre d'entrée croissant dans chaque groupe
        if (t[i - 1].source === t[i].source) {
          expect(Number(t[i - 1].id.slice(1))).toBeLessThan(Number(t[i].id.slice(1)));
        } else {
          expect(t[i - 1].source).toBe('event');
        }
      }
    }
  });

  it('ne mute ni ne partage les objets d’entrée (copies profondes de surface)', () => {
    const events = [ev({ id: 'e1', date: '2026-01-01', vet: 'Dr' })];
    const t = buildTimeline(events, []);
    t[0].title = 'modifié';
    expect(events[0].title).toBe('Rage');
  });
});

describe('filterTimeline', () => {
  const t = buildTimeline([ev({ id: 'v', date: '2026-01-02' })], [w('w', '2026-01-01', 4)]);

  it('ALL renvoie la MÊME référence (pas une copie)', () => {
    expect(filterTimeline(t, 'ALL')).toBe(t);
  });

  it('un filtre sans correspondance renvoie un tableau vide, sur liste vide aussi', () => {
    expect(filterTimeline(t, 'VISIT')).toEqual([]);
    expect(filterTimeline([], 'ALL')).toEqual([]);
    expect(filterTimeline([], 'CARE')).toEqual([]);
  });

  it('un filtre ne mute pas l’entrée et renvoie un nouveau tableau', () => {
    const before = [...t];
    const r = filterTimeline(t, 'WEIGHT');
    expect(r).not.toBe(t);
    expect(t).toEqual(before);
  });

  it('un filtre inconnu (valeur hors type) renvoie vide plutôt que de planter', () => {
    expect(filterTimeline(t, 'BIDON' as never)).toEqual([]);
  });
});

describe('weightTrend', () => {
  it('delta négatif', () => {
    expect(weightTrend([w('a', '2026-01-01', 4.5), w('b', '2026-02-01', 4.2)]).deltaKg).toBe(-0.3);
  });

  it('delta nul : 0 (pas -0)', () => {
    const r = weightTrend([w('a', '2026-01-01', 4.2), w('b', '2026-02-01', 4.2)]);
    expect(Object.is(r.deltaKg, 0)).toBe(true);
  });

  it('flottants : 4,2 - 4,1 = 0,1', () => {
    expect(weightTrend([w('a', '2026-01-01', 4.1), w('b', '2026-02-01', 4.2)]).deltaKg).toBe(0.1);
  });

  // Défaut mineur : delta calculé sur les valeurs brutes (18.65-18.6 = 0.0499… -> 0) alors que formatKg affiche 18,7 vs 18,6 (+0,1).
  it('delta cohérent avec l’affichage formatKg (18,65 vs 18,6)', () => {
    expect(weightTrend([w('a', '2026-01-01', 18.6), w('b', '2026-02-01', 18.65)]).deltaKg).toBe(0.1);
  });

  // Défaut mineur : Math.round(-0.4)/10 donne -0 ; sans effet visuel (String(-0) === "0") mais fuite d'un -0 dans l'API.
  it('petite variation négative (-0,04) : deltaKg n’est pas -0', () => {
    const r = weightTrend([w('a', '2026-01-01', 4.3), w('b', '2026-02-01', 4.26)]);
    expect(Object.is(r.deltaKg, -0)).toBe(false);
  });

  it('since = avant-dernière pesée par date, pas par position', () => {
    const r = weightTrend([w('c', '2026-02-01', 5), w('a', '2026-03-01', 6), w('d', '2026-01-01', 1), w('b', '2026-02-15', 5.5)]);
    expect(r).toEqual({ latestKg: 6, deltaKg: 0.5, since: '2026-02-15' });
  });

  it('deux pesées le même jour : la première en entrée est « latest » (tri stable)', () => {
    const r = weightTrend([w('a', '2026-02-01', 4), w('b', '2026-02-01', 5)]);
    expect(r).toEqual({ latestKg: 4, deltaKg: -1, since: '2026-02-01' });
  });

  it('poids 0 : latest 0 est bien renvoyé (pas traité comme absent)', () => {
    expect(weightTrend([w('a', '2026-01-01', 0)])).toEqual({ latestKg: 0, deltaKg: null, since: null });
    expect(weightTrend([w('a', '2026-01-01', 3), w('b', '2026-02-01', 0)]).deltaKg).toBe(-3);
  });

  it('dates ISO avec heure : le même jour est ordonné par l’heure', () => {
    const r = weightTrend([w('a', '2026-03-03T08:00:00.000Z', 4), w('b', '2026-03-03T20:00:00.000Z', 4.4)]);
    expect(r).toEqual({ latestKg: 4.4, deltaKg: 0.4, since: '2026-03-03T08:00:00.000Z' });
  });

  it('dates invalides : ne plante pas', () => {
    expect(() => weightTrend([w('a', '', 4), w('b', 'x', 5)])).not.toThrow();
  });

  it('ne mute pas l’entrée (ordre conservé avec 4 pesées désordonnées)', () => {
    const ws = [w('a', '2026-03-01', 1), w('b', '2026-01-01', 2), w('c', '2026-02-01', 3), w('d', '2026-04-01', 4)];
    weightTrend(ws);
    expect(ids(ws)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('formatKg — limites', () => {
  it('zéro, négatif, très petit, arrondi bas', () => {
    expect(formatKg(0)).toBe('0 kg');
    expect(formatKg(-0.3)).toBe('-0,3 kg');
    expect(formatKg(1e-7)).toBe('0 kg');
    expect(formatKg(-1e-7)).toBe('0 kg');
    expect(formatKg(100.04)).toBe('100 kg');
    expect(formatKg(100.05)).toBe('100,1 kg');
  });

  // Défaut mineur : NaN / Infinity ne tombent pas dans le cas « — » (seul null/undefined l'est) → "NaN kg" / "Infinity kg".
  it('NaN rend le tiret', () => {
    expect(formatKg(NaN)).toBe('—');
  });

  it('Infinity rend le tiret', () => {
    expect(formatKg(Infinity)).toBe('—');
  });
});
