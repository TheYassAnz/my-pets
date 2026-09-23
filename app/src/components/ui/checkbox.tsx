import { Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { Icon } from './icon';
import { Colors } from '@/constants/theme';

export type CheckboxProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  accessibilityLabel?: string;
  variant?: 'square' | 'round';
};

export function Checkbox({
  checked,
  onCheckedChange,
  accessibilityLabel,
  variant = 'square',
}: CheckboxProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onCheckedChange?.(!checked)}
      className={`items-center justify-center border ${
        variant === 'round' ? 'h-5 w-5 rounded-full' : 'h-6 w-6 rounded-sm'
      } ${
        checked ? 'border-brand bg-brand' : 'border-border bg-surface'
      }`}>
      {checked && (
        <Icon
          name="check"
          size={variant === 'round' ? 12 : 16}
          color={colors.onBrand}
          decorative
        />
      )}
    </Pressable>
  );
}
