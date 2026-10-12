import { ActivityIndicator, Pressable, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-sunken',
  destructive: '',
  ghost: '',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-text',
  destructive: 'text-danger',
  ghost: 'text-text',
};

// L'icône ne peut pas hériter de la classe du libellé (Text ne transmet pas sa
// couleur à un enfant Text distinct) : on la résout ici depuis Colors, pour
// qu'elle reste alignée avec `LABEL` ci-dessus.
const ICON_COLOR_KEY: Record<ButtonVariant, keyof typeof Colors.light> = {
  primary: 'onPrimary',
  secondary: 'text',
  destructive: 'danger',
  ghost: 'text',
};

export type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  onPress?: () => void;
  /** Remplace le libellé pour les lecteurs d'écran si le texte visible est ambigu. */
  accessibilityLabel?: string;
  /** Fusionnée en dernier dans la classe du conteneur : permet à l'appelant de surcharger le style. */
  className?: string;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-lg px-4 py-3 active:opacity-70 ${
        CONTAINER[variant]
      } ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}>
      {loading ? (
        <ActivityIndicator color={colors[ICON_COLOR_KEY[variant]]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? (
            <Icon name={icon} size={18} decorative color={colors[ICON_COLOR_KEY[variant]]} />
          ) : null}
          <Text className={`text-body font-bold ${LABEL[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
