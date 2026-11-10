import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Équivalent de `Card` mais sans cadre ni Coins.
 * Une simple section d'élevation de surface, séparée du reste par un `Divider`.
 * Pas de `border`, pas de `rounded`.
 */
export type SectionProps = {
  children: ReactNode;
  /** Élévation de la surface (légèrement plus clair / plus sombre). */
  elevated?: boolean;
  /** Fusionnée en dernier : permet à l'appelant de surcharger le style. */
  className?: string;
};

export function Section({ children, elevated = false, className }: SectionProps) {
  return (
    <View
      className={`gap-3 p-4 ${elevated ? 'bg-surface-elevated' : ''} ${className ?? ''}`}
    >
      {children}
    </View>
  );
}
