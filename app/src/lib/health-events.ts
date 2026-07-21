import type { IconName } from '@/components/ui';

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
