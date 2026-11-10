import type { BadgeState, IconName } from '@/components/ui';

import { parseIsoDate } from './dates';
import type { HealthEventType } from './api';

export const EVENT_TYPES: HealthEventType[] = ['VACCINE', 'TREATMENT', 'VISIT'];

export const EVENT_LABELS: Record<HealthEventType, string> = {
  VACCINE: 'Vaccin',
  TREATMENT: 'Traitement',
  VISIT: 'Visite',
};

export const EVENT_ICONS: Record<HealthEventType, IconName> = {
  VACCINE: 'vaccine',
  TREATMENT: 'treatment',
  VISIT: 'visit',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Nombre de jours (signé) entre aujourd'hui et une échéance — négatif si dépassée.
export function daysUntil(iso: string, today: Date = new Date()): number {
  const date = parseIsoDate(iso);
  if (!date) return 0;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000);
}

const SOON_THRESHOLD_DAYS = 14;

export function deadlineState(days: number): BadgeState {
  if (days < 0) return 'late';
  if (days <= SOON_THRESHOLD_DAYS) return 'soon';
  return 'ok';
}
