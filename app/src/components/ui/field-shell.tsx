import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type FieldShellProps = {
  label?: string;
  error?: string;
  children: ReactNode;
};

export function FieldShell({ label, error, children }: FieldShellProps) {
  return (
    <View className="gap-2">
      {label && <Text className="text-body font-semibold text-text ml-1">{label}</Text>}

      {children}

      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-caption text-danger ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
