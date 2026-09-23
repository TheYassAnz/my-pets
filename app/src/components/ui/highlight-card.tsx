import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type HighlightCardProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function HighlightCard({
  kicker = 'Prochain rendez-vous',
  title,
  subtitle,
  actions,
  className,
}: HighlightCardProps) {
  return (
    <View
      className={`rounded-lg p-4 bg-brand/20 border border-brand/40 gap-1.5 overflow-hidden ${
        className ?? ''
      }`}>
      {kicker ? (
        <Text className="text-[10px] font-medium tracking-wider uppercase text-primary">
          {kicker}
        </Text>
      ) : null}

      <Text className="text-[19px] font-medium text-text mt-1">{title}</Text>

      {subtitle ? (
        <Text className="text-[13px] text-text-secondary mt-0.5 leading-relaxed">
          {subtitle}
        </Text>
      ) : null}

      {actions ? <View className="flex-row gap-2.5 mt-3">{actions}</View> : null}
    </View>
  );
}
