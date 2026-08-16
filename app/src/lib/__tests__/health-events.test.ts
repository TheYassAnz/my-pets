import { daysUntil, deadlineState } from '@/lib/health-events';

describe('daysUntil', () => {
  it('compte les jours restants jusqu’à une date future', () => {
    const today = new Date(2026, 2, 1); // 1er mars 2026
    expect(daysUntil('2026-03-15', today)).toBe(14);
  });

  it('renvoie 0 le jour même', () => {
    const today = new Date(2026, 2, 1);
    expect(daysUntil('2026-03-01', today)).toBe(0);
  });

  it('renvoie un nombre négatif pour une échéance dépassée', () => {
    const today = new Date(2026, 2, 15);
    expect(daysUntil('2026-03-01', today)).toBe(-14);
  });
});

describe('deadlineState', () => {
  it('est "late" pour un nombre de jours négatif', () => {
    expect(deadlineState(-1)).toBe('late');
  });

  it('est "soon" proche de l’échéance (0 à 14 jours)', () => {
    expect(deadlineState(0)).toBe('soon');
    expect(deadlineState(14)).toBe('soon');
  });

  it('est "ok" au-delà du seuil', () => {
    expect(deadlineState(15)).toBe('ok');
  });
});
