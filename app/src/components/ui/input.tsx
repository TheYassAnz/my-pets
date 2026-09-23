import { forwardRef } from 'react';
import { Text, TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type InputProps = Omit<TextInputProps, 'placeholderTextColor' | 'accessibilityLabel'> & {
  label?: string; // Rend le label optionnel si on fait un wizard ultra épuré
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, multiline, className, ...rest },
  ref,
) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="gap-2">
      {label && <Text className="text-body font-semibold text-text ml-1">{label}</Text>}

      <TextInput
        ref={ref}
        accessibilityLabel={error ? `${label ?? 'Champ'}, erreur : ${error}` : (label ?? 'Champ')}
        multiline={multiline}
        placeholderTextColor={colors.textTertiary}
        className={`min-h-[46px] rounded-md px-3.5 py-2.5 text-body text-text bg-surface border ${
          error ? 'border-danger bg-danger-surface' : 'border-border'
        } ${multiline ? 'min-h-[100px] pt-3' : ''} ${className ?? ''}`}
        {...rest}
      />

      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-caption text-danger ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
