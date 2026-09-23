import { Pressable, Text, View } from 'react-native';

import { Icon } from './icon';
import { useAppStore } from '@/lib/store/use-app-store';

export type OfflineBannerProps = {
  onRetry?: () => void;
  className?: string;
};

export function OfflineBanner({ onRetry, className }: OfflineBannerProps) {
  const { isOffline, lastSyncedAt } = useAppStore();

  if (!isOffline) return null;

  let timeAgo = 'récemment';
  if (lastSyncedAt) {
    const diffHours = Math.round((Date.now() - lastSyncedAt) / (1000 * 60 * 60));
    timeAgo = diffHours > 0 ? `il y a ${diffHours} h` : 'il y a quelques minutes';
  } else {
    timeAgo = 'il y a 2 h';
  }

  return (
    <View
      style={{
        backgroundColor: 'rgba(120, 105, 48, 0.18)',
        borderColor: '#7d6a34',
      }}
      className={`mx-5 my-2 flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-md border ${
        className ?? ''
      }`}>
      <Icon name="alert" size={16} color="#ddc98a" decorative />
      <Text style={{ color: '#ddc98a' }} className="flex-1 text-[12.5px] leading-snug">
        Hors ligne — dernière synchro {timeAgo}
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={{ color: '#ddc98a' }} className="text-[12px] font-semibold underline">
            Synchro
          </Text>
        </Pressable>
      )}
    </View>
  );
}
