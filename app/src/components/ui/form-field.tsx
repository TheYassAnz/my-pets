import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import type { TextInput } from 'react-native';
import type { RefObject } from 'react';

import { Input, type InputProps } from './input';

export type FormFieldProps<T extends FieldValues> = Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<T>;
  name: Path<T>;
  // `forwardRef` s'accorde mal avec un composant générique : la ref du champ
  // natif passe donc par une prop dédiée, utilisée pour le chaînage clavier.
  inputRef?: RefObject<TextInput | null>;
};

export function FormField<T extends FieldValues>({
  control,
  name,
  inputRef,
  ...rest
}: FormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <Input
      ref={inputRef}
      value={field.value ?? ''}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      {...rest}
    />
  );
}
