import { Text, View } from 'react-native';

import { Button } from './button';
import { Icon } from './icon';

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      <Icon name="alert" size={40} decorative />
      <Text className="text-callout text-text-secondary text-center">{message}</Text>
      {onRetry ? (
        <View className="mt-2">
          <Button label="Réessayer" variant="secondary" icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
