import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type FieldShellProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

// Libellé + message d'erreur, extraits de `Input` pour que les champs qui ne
// reposent pas sur un `TextInput` (espèce, dates) aient exactement la même
// présentation et le même comportement d'annonce que les champs texte.
export function FieldShell({ label, error, children }: FieldShellProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-caption font-medium text-text-secondary">{label}</Text>

      {children}

      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-caption text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
