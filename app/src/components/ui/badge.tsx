import { Text, View } from 'react-native';

export type BadgeState = 'ok' | 'soon' | 'late';

/**
 * Badge d'état — dit quand une échéance est ok, proche ou dépassée.
 * Un seul objet visuel, décliné partout (écran, ligne, timeline).
 */
export type BadgeProps = {
  state: BadgeState;
  label?: string;
  testID?: string;
};

const DOT_COLOR: Record<BadgeState, string> = {
  ok: 'bg-status-ok',
  soon: 'bg-status-soon',
  late: 'bg-status-late',
};

const TEXT_COLOR: Record<BadgeState, string> = {
  ok: 'text-status-ok',
  soon: 'text-status-soon',
  late: 'text-status-late',
};

export function Badge({ state, label, testID }: BadgeProps) {
  return (
    <View
      testID={testID}
      className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 bg-surface-sunken">
      <View
        testID={testID ? `${testID}-dot` : undefined}
        className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[state]}`}
      />
      {label && <Text className={`text-caption font-medium ${TEXT_COLOR[state]}`}>{label}</Text>}
    </View>
  );
}
