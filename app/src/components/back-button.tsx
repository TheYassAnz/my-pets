import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui';

export function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour"
      hitSlop={8}
      onPress={() => router.back()}
      className="h-11 w-11 items-center justify-center rounded-full bg-surface-sunken">
      <Icon name="chevron-back" size={22} decorative />
    </Pressable>
  );
}
