import type { ReactNode } from 'react';
import { View } from 'react-native';

export type CardProps = {
  children: ReactNode;
  /** Fond légèrement relevé, pour distinguer la carte du fond d'écran. */
  elevated?: boolean;
  /** Fusionnée en dernier : permet à l'appelant de surcharger le style. */
  className?: string;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function Card({ children, elevated = false, className, testID }: CardProps) {
  return (
    <View
      testID={testID}
      className={`gap-3 rounded-lg border border-border p-4 ${
        elevated ? 'bg-surface-elevated' : 'bg-surface'
      } ${className ?? ''}`}>
      {children}
    </View>
  );
}
