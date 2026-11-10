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
const w = (id: string, date: string, weightKg: number): WeightRecord => ({
  id,
  date,
  weightKg,
  animalId: 'a1',
});

describe('buildTimeline', () => {
  it('renvoie une liste vide sans données', () => {
    expect(buildTimeline([], [])).toEqual([]);
  });

  it('fusionne et trie par date décroissante', () => {
    const t = buildTimeline(
      [ev({ id: 'e1', date: '2026-01-10' }), ev({ id: 'e2', date: '2026-03-01' })],
      [w('w1', '2026-02-01', 4.2)],
    );
    expect(t.map((e) => e.id)).toEqual(['e2', 'w1', 'e1']);
  });

  it('à date égale : événement avant pesée, puis ordre d’entrée', () => {
    const t = buildTimeline(
      [ev({ id: 'e1', date: '2026-02-01' }), ev({ id: 'e2', date: '2026-02-01' })],
      [w('w1', '2026-02-01', 4), w('w2', '2026-02-01', 5)],
    );
    expect(t.map((e) => e.id)).toEqual(['e1', 'e2', 'w1', 'w2']);
  });

  it('mappe un événement', () => {
    const [e] = buildTimeline(
      [ev({ id: 'e1', date: '2026-02-01', type: 'VISIT', title: 'Contrôle', vet: 'Dr Roux', dosage: '2 ml', nextDueDate: '2027-02-01' })],
      [],
    );
    expect(e).toEqual({
      id: 'e1',
      kind: 'VISIT',
      date: '2026-02-01',
      title: 'Contrôle',
      detail: 'Dr Roux · 2 ml',
      nextDueDate: '2027-02-01',
      source: 'event',
    });
  });

  it('detail : vet seul, dosage seul, ou null', () => {
    const t = buildTimeline(
      [
        ev({ id: 'a', date: '2026-01-04', vet: 'Dr Roux' }),
        ev({ id: 'b', date: '2026-01-03', dosage: '2 ml' }),
        ev({ id: 'c', date: '2026-01-02' }),
      ],
      [],
    );
    expect(t.map((e) => e.detail)).toEqual(['Dr Roux', '2 ml', null]);
  });

  it('mappe une pesée', () => {
    const [e] = buildTimeline([], [w('w1', '2026-02-01', 4.2)]);
    expect(e).toEqual({
      id: 'w1',
      kind: 'WEIGHT',
      date: '2026-02-01',
      title: 'Pesée',
      detail: '4,2 kg',
      nextDueDate: null,
      source: 'weight',
    });
  });

  it('ne mute pas les entrées', () => {
    const events = [ev({ id: 'e1', date: '2026-01-01' }), ev({ id: 'e2', date: '2026-02-01' })];
    const weights = [w('w1', '2026-01-01', 4), w('w2', '2026-03-01', 5)];
    const e0 = structuredClone(events);
    const w0 = structuredClone(weights);
    buildTimeline(events, weights);
    expect(events).toEqual(e0);
    expect(weights).toEqual(w0);
  });
});

describe('filterTimeline', () => {
  const t = buildTimeline(
    [
      ev({ id: 'v', date: '2026-01-03', type: 'VACCINE' }),
      ev({ id: 't', date: '2026-01-02', type: 'TREATMENT' }),
      ev({ id: 'x', date: '2026-01-01', type: 'VISIT' }),
    ],
    [w('w', '2026-01-04', 4)],
  );
  it.each([
    ['ALL', ['w', 'v', 't', 'x']],
    ['VACCINE', ['v']],
    ['CARE', ['t']],
    ['VISIT', ['x']],
    ['WEIGHT', ['w']],
  ] as const)('filtre %s', (filter, ids) => {
    expect(filterTimeline(t, filter).map((e) => e.id)).toEqual(ids);
  });
});

describe('weightTrend', () => {
  it('aucune pesée', () => {
    expect(weightTrend([])).toEqual({ latestKg: null, deltaKg: null, since: null });
  });

  it('une seule pesée', () => {
    expect(weightTrend([w('a', '2026-01-01', 4.2)])).toEqual({ latestKg: 4.2, deltaKg: null, since: null });
  });

  it('deux pesées désordonnées, sans artefact flottant', () => {
    expect(weightTrend([w('a', '2026-02-01', 4.2), w('b', '2026-01-01', 4.1)])).toEqual({
      latestKg: 4.2,
      deltaKg: 0.1,
      since: '2026-01-01',
    });
  });

  it('delta négatif, avant-dernière pesée parmi plusieurs', () => {
    const r = weightTrend([w('a', '2026-01-01', 9), w('b', '2026-03-01', 4.3), w('c', '2026-02-01', 4.5)]);
    expect(r).toEqual({ latestKg: 4.3, deltaKg: -0.2, since: '2026-02-01' });
  });

  it('ne mute pas l’entrée', () => {
    const ws = [w('a', '2026-01-01', 4), w('b', '2026-02-01', 5)];
    weightTrend(ws);
    expect(ws.map((x) => x.id)).toEqual(['a', 'b']);
  });
});
