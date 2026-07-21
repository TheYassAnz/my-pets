import type { ReactNode } from 'react';
import { View } from 'react-native';

export type CardProps = {
  children: ReactNode;
  /** Fond légèrement relevé, pour distinguer la carte du fond d'écran. */
  elevated?: boolean;
};

export function Card({ children, elevated = false }: CardProps) {
  return (
    <View
      className={`gap-3 rounded-lg border border-border p-4 ${
        elevated ? 'bg-surface-elevated' : 'bg-surface'
      }`}>
      {children}
    </View>
  );
}
