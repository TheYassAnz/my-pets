import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './text';

export type FieldShellProps = {
  label?: string;
  error?: string;
  children: ReactNode;
};

export function FieldShell({ label, error, children }: FieldShellProps) {
  return (
    <View className="gap-1">
      {label && <Text className="text-caption font-medium text-text-secondary">{label}</Text>}

      {children}

      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-caption text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
