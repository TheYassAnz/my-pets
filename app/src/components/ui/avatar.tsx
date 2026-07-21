import { Image } from 'expo-image';
import { View } from 'react-native';

import { Icon } from './icon';

export type AvatarSize = 'sm' | 'lg';

const BOX: Record<AvatarSize, string> = {
  sm: 'w-12 h-12',
  lg: 'w-28 h-28',
};

const GLYPH: Record<AvatarSize, number> = {
  sm: 20,
  lg: 44,
};

export type AvatarProps = {
  /** Photo de l'animal. Absente → repli icône. */
  uri?: string | null;
  size?: AvatarSize;
  /** Nom accessible de la photo. Omis → l'avatar est décoratif. */
  label?: string;
  testID?: string;
};

export function Avatar({ uri, size = 'sm', label, testID }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={label}
        testID={testID}
        contentFit="cover"
        className={`${BOX[size]} rounded-full`}
      />
    );
  }

  return (
    <View
      testID={testID}
      className={`${BOX[size]} items-center justify-center rounded-full bg-surface-sunken`}>
      <Icon name="paw" size={GLYPH[size]} decorative />
    </View>
  );
}
