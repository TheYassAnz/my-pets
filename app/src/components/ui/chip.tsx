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
        selected ? 'border-primary bg-primary' : 'border-border'
      }`}>
      <Text
        className={`text-callout ${selected ? 'font-semibold text-on-primary' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
