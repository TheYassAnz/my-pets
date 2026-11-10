import { formatKg, roundKg } from '@/lib/animals';
import type { HealthEvent, WeightRecord } from '@/lib/api';

export type TimelineKind = 'VACCINE' | 'TREATMENT' | 'VISIT' | 'WEIGHT';
export type TimelineFilter = 'ALL' | 'VACCINE' | 'CARE' | 'VISIT' | 'WEIGHT';

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  date: string;
  title: string;
  detail: string | null;
  nextDueDate: string | null;
  source: 'event' | 'weight';
};

// Dates ISO courtes (AAAA-MM-JJ) : la comparaison lexicographique suffit.
// Array.sort est stable : l'ordre d'entrée départage les égalités.
const byDateDesc = <T extends { date: string }>(a: T, b: T) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

export function buildTimeline(events: HealthEvent[], weights: WeightRecord[]): TimelineEntry[] {
  const fromEvents: TimelineEntry[] = events.map((e) => ({
    id: e.id,
    kind: e.type,
    date: e.date,
    title: e.title,
    // detail : vétérinaire puis dosage, s'ils existent.
    detail: [e.vet, e.dosage].filter(Boolean).join(' · ') || null,
    nextDueDate: e.nextDueDate,
    source: 'event',
  }));
  const fromWeights: TimelineEntry[] = weights.map((w) => ({
    id: w.id,
    kind: 'WEIGHT',
    date: w.date,
    title: 'Pesée',
    detail: formatKg(w.weightKg),
    nextDueDate: null,
    source: 'weight',
  }));
  // Événements d'abord : à date égale ils précèdent les pesées.
  return [...fromEvents, ...fromWeights].sort(byDateDesc);
}

export function filterTimeline(entries: TimelineEntry[], filter: TimelineFilter): TimelineEntry[] {
  if (filter === 'ALL') return entries;
  const kind = filter === 'CARE' ? 'TREATMENT' : filter;
  return entries.filter((e) => e.kind === kind);
}

export function weightTrend(weights: WeightRecord[]): {
  latestKg: number | null;
  deltaKg: number | null;
  since: string | null;
} {
  const [latest, previous] = [...weights].sort(byDateDesc);
  if (!latest) return { latestKg: null, deltaKg: null, since: null };
  if (!previous) return { latestKg: latest.weightKg, deltaKg: null, since: null };
  return {
    latestKg: latest.weightKg,
    // Écart calculé sur les poids affichés ; `+ 0` évite -0.
    deltaKg: roundKg(roundKg(latest.weightKg) - roundKg(previous.weightKg)) + 0,
    since: previous.date,
  };
}
