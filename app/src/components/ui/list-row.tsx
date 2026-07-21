import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Par défaut : « titre, sous-titre ». */
  accessibilityLabel?: string;
  /** Fusionnée en dernier : permet à l'appelant de surcharger le style. */
  className?: string;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View className="flex-1">
        <Text className="text-headline font-semibold text-text">{title}</Text>
        {subtitle ? <Text className="text-callout text-text-secondary">{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );

  const layout = 'min-h-11 flex-row items-center gap-3 rounded-md border border-border p-3';

  if (!onPress) {
    return (
      <View testID={testID} className={`${layout} ${className ?? ''}`}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      testID={testID}
      className={`${layout} active:bg-surface-sunken ${className ?? ''}`}>
      {content}
    </Pressable>
  );
}
