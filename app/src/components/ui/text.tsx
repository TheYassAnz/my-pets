import { Text as RNText, TextInput as RNTextInput, type TextInputProps, type TextProps } from 'react-native';
import { forwardRef } from 'react';

import { resolveFont } from '@/constants/fonts';

// Remplace `Text` / `TextInput` de react-native : applique la police de l'app
// selon la classe `font-*`, que NativeWind ne sait pas traduire en famille.
export function Text({ className, style, ...rest }: TextProps) {
  const font = resolveFont(className);
  return <RNText className={font.className} style={[{ fontFamily: font.fontFamily }, style]} {...rest} />;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { className, style, ...rest },
  ref,
) {
  const font = resolveFont(className);
  return (
    <RNTextInput
      ref={ref}
      className={font.className}
      style={[{ fontFamily: font.fontFamily }, style]}
      {...rest}
    />
  );
});
