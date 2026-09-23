import { Pressable, Text } from 'react-native';

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
      className={`min-h-11 items-center justify-center rounded-full border px-4 ${
        selected ? 'border-brand bg-brand/20' : 'border-border bg-surface'
      }`}>
      <Text
        className={`text-body ${selected ? 'font-medium text-brand' : 'text-text-secondary'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
