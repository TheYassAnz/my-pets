import { View } from 'react-native';

export type SkeletonProps = {
  variant?: 'row' | 'card' | 'circle';
  count?: number;
  testID?: string;
};

const SHAPE: Record<NonNullable<SkeletonProps['variant']>, string> = {
  row: 'h-16 rounded-md',
  card: 'h-32 rounded-lg',
  circle: 'h-14 w-14 rounded-full',
};

export function Skeleton({ variant = 'row', count = 1, testID }: SkeletonProps) {
  return (
    <View
      accessible
      accessibilityLabel="Chargement en cours"
      accessibilityState={{ busy: true }}
      className="gap-3">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          testID={testID ? `${testID}-item` : undefined}
          className={`bg-surface-sunken ${SHAPE[variant]}`}
        />
      ))}
    </View>
  );
}
