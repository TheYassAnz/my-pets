import { Text, View } from 'react-native';

import { Typography } from '@/constants/theme';

export type MetricState = 'ok' | 'soon' | 'late';

/**
 * Compteur d'échéance — le chiffre qui compte.
 * En 48px semibold tabular-nums, plein cadre, c'est le héros de l'écran.
 */
export type MetricProps = {
  days: number;
  state: MetricState;
  label?: string;
};

const TEXT_COLOR: Record<MetricState, string> = {
  ok: 'text-status-ok',
  soon: 'text-status-soon',
  late: 'text-status-late',
};

export function Metric({ days, state, label }: MetricProps) {
  return (
    <View className="flex-col items-start gap-1">
      <Text
        style={[Typography.metric, { fontVariant: ['tabular-nums'] }]}
        className={TEXT_COLOR[state]}>
        {days}
      </Text>
      <Text className="text-caption text-text-secondary">jours</Text>
      {label && <Text className="text-headline text-text">{label}</Text>}
    </View>
  );
}
