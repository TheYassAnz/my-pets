import { Pressable, Text, View } from 'react-native';

export type SegmentedOption = { value: string; label: string };

export type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row rounded-full bg-surface p-1 gap-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-9 flex-1 items-center justify-center rounded-full py-2 ${
              selected ? 'bg-brand/20 border border-brand/50' : 'border border-transparent'
            }`}>
            <Text
              className={`text-caption ${
                selected ? 'font-medium text-brand' : 'text-text-secondary'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
