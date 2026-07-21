import { forwardRef } from 'react';
import { Text, TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type InputProps = Omit<TextInputProps, 'placeholderTextColor' | 'accessibilityLabel'> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, multiline, className, ...rest },
  ref,
) {
  // `placeholderTextColor` n'accepte qu'une couleur résolue : NativeWind ne mappe
  // pas `placeholderClassName` à l'exécution (il est typé mais ignoré en 4.2.6).
  // On lit donc le token depuis Colors, qui est synchronisé avec global.css.
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="gap-1.5">
      <Text className="text-caption font-medium text-text-secondary">{label}</Text>

      <TextInput
        ref={ref}
        // React Native n'a ni `aria-invalid` ni `accessibilityState.invalid` :
        // joindre l'erreur au libellé est le seul moyen de l'annoncer.
        accessibilityLabel={error ? `${label}, erreur : ${error}` : label}
        multiline={multiline}
        // Contraste conforme (≥4.5:1) : remplace l'ancien #9ca3af (~2.5:1).
        placeholderTextColor={colors.textTertiary}
        className={`min-h-11 rounded-md border px-4 py-3 text-body text-text bg-surface ${
          error ? 'border-danger' : 'border-border'
        } ${multiline ? 'min-h-24' : ''} ${className ?? ''}`}
        {...rest}
      />

      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-caption text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
