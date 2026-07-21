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
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
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
    return <View className={layout}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      className={`${layout} active:bg-surface-sunken`}>
      {content}
    </Pressable>
  );
}
