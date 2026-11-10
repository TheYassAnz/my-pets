import { Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { Button } from './button';
import { Icon, type IconName } from './icon';

export type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      <Icon name={icon} size={40} decorative color={colors.textSecondary} />
      <Text className="text-headline font-semibold text-text text-center">{title}</Text>
      {message ? (
        <Text className="text-body text-text-secondary text-center">{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
