import { Pressable, View } from 'react-native';

import { Text } from './text';

export type SegmentedOption = { value: string; label: string };

export type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row rounded-xl bg-surface-sunken p-[3px]">
      {options.map((option) => {
        const selected = option.value === value;
        // rayon = rayon du conteneur (24) − padding (3) : angles concentriques
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-11 flex-1 items-center justify-center rounded-[21px] py-2 ${
              selected ? 'bg-surface' : ''
            }`}>
            <Text
              className={`text-[14px] font-bold ${selected ? 'text-text' : 'text-text-secondary'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
