import { forwardRef, useState } from 'react';
import { useColorScheme, type TextInput as RNTextInput, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/theme';

import { FieldShell } from './field-shell';
import { TextInput } from './text';

export type InputProps = Omit<TextInputProps, 'placeholderTextColor' | 'accessibilityLabel'> & {
  label?: string; // Rend le label optionnel si on fait un wizard ultra épuré
  error?: string;
};

export const Input = forwardRef<RNTextInput, InputProps>(function Input(
  { label, error, multiline, className, onFocus, onBlur, ...rest },
  ref,
) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [focused, setFocused] = useState(false);

  // Filet souligné : danger en erreur, épais et sombre au focus, discret sinon.
  const rule = error
    ? 'border-b-[1.5px] border-danger'
    : focused
      ? 'border-b-2 border-text'
      : 'border-b-[1.5px] border-border';

  return (
    <FieldShell label={label} error={error}>
      <TextInput
        ref={ref}
        accessibilityLabel={error ? `${label ?? 'Champ'}, erreur : ${error}` : (label ?? 'Champ')}
        multiline={multiline}
        placeholderTextColor={colors.textTertiary}
        className={`min-h-11 pb-2.5 pt-1 text-[18px] font-semibold text-text ${rule} ${
          multiline ? 'min-h-[100px]' : ''
        } ${className ?? ''}`}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </FieldShell>
  );
});
