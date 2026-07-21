import { useColorScheme, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { Icon, type IconName } from './icon';

export type BadgeTone = 'neutral' | 'primary' | 'warning';

const CONTAINER: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken',
  primary: 'bg-primary-surface',
  warning: 'bg-surface-sunken',
};

const LABEL: Record<BadgeTone, string> = {
  neutral: 'text-text-secondary',
  primary: 'text-primary',
  warning: 'text-warning',
};

export type BadgeProps = {
  label: string;
  icon?: IconName;
  tone?: BadgeTone;
  testID?: string;
};

export function Badge({ label, icon, tone = 'neutral', testID }: BadgeProps) {
  // `Icon` attend une couleur résolue : une classe ne l'atteindrait pas.
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const glyphColor = tone === 'primary' ? colors.primary : colors.textSecondary;

  return (
    <View
      testID={testID}
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${CONTAINER[tone]}`}>
      {icon ? <Icon name={icon} size={14} color={glyphColor} decorative /> : null}
      <Text className={`text-caption font-medium ${LABEL[tone]}`}>{label}</Text>
    </View>
  );
}
