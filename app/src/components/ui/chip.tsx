import { Pressable } from 'react-native';

import { Text } from './text';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-11 items-center justify-center rounded-full px-4 py-2 ${
        selected ? 'bg-text' : 'bg-surface-sunken'
      }`}>
      <Text className={`text-[14px] font-bold ${selected ? 'text-surface' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
