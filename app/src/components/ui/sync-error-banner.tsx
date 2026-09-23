import { Text, View } from 'react-native';

import { Button } from './button';
import { Icon } from './icon';

export type SyncErrorBannerProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export function SyncErrorBanner({
  title = 'Import impossible',
  description = "Le document est conservé sur l'appareil et sera envoyé dès que la connexion revient.",
  onRetry,
  onDismiss,
  className,
}: SyncErrorBannerProps) {
  return (
    <View
      className={`rounded-lg bg-surface border border-red-500/30 shadow-xl p-4 gap-3 ${
        className ?? ''
      }`}>
      <View className="flex-row gap-3 items-start">
        <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center">
          <Icon name="alert" size={16} color="#e2919f" decorative />
        </View>
        <View className="flex-1">
          <Text className="text-[14.5px] font-medium text-text">{title}</Text>
          <Text className="text-[12.5px] text-text-secondary leading-relaxed mt-1">
            {description}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2.5 mt-1">
        {onDismiss && (
          <Button variant="secondary" size="sm" onPress={onDismiss} className="flex-1">
            Plus tard
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" size="sm" onPress={onRetry} className="flex-1">
            Réessayer
          </Button>
        )}
      </View>
    </View>
  );
}
