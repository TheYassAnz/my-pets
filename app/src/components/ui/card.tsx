import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

export type CardProps = {
  children: ReactNode;
  /** Fond légèrement relevé, pour distinguer la carte du fond d'écran. */
  elevated?: boolean;
  /** Rend la carte actionnable. Absent → carte statique, non annoncée comme bouton. */
  onPress?: () => void;
  /** Nom accessible, requis en pratique dès que `onPress` est fourni. */
  accessibilityLabel?: string;
  /** Fusionnée en dernier : permet à l'appelant de surcharger le style. */
  className?: string;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function Card({
  children,
  elevated = false,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: CardProps) {
  const layout = `gap-3 rounded-lg border border-border p-4 ${
    elevated ? 'bg-surface-elevated' : 'bg-surface'
  } ${className ?? ''}`;

  if (!onPress) {
    return (
      <View testID={testID} className={layout}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      className={`${layout} active:bg-surface-sunken`}>
      {children}
    </Pressable>
  );
}
