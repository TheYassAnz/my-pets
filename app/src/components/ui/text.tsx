import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { forwardRef } from 'react';

import { resolveFont } from '@/constants/fonts';

// `style` doit rester un objet : NativeWind web ajoute la classe par `push` dans un
// tableau, et React Compiler réutilise ce tableau, donc les classes s'y empilent.
// Remplace `Text` / `TextInput` de react-native : applique la police de l'app
// selon la classe `font-*`, que NativeWind ne sait pas traduire en famille.
export function Text({ className, style, ...rest }: TextProps) {
  const font = resolveFont(className);
  return <RNText className={font.className} style={StyleSheet.flatten([{ fontFamily: font.fontFamily }, style])} {...rest} />;
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
      style={StyleSheet.flatten([{ fontFamily: font.fontFamily }, style])}
      {...rest}
    />
  );
});
