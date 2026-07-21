import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-pressed',
  secondary: 'border border-border active:bg-surface-sunken',
  destructive: 'border border-danger active:bg-danger-surface',
  ghost: 'active:opacity-70',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-text',
  destructive: 'text-danger',
  ghost: 'text-primary',
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
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  onPress,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-11 flex-row items-center justify-center gap-2 rounded-md px-4 py-3 ${
        CONTAINER[variant]
      } ${isDisabled ? 'opacity-50' : ''}`}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Icon name={icon} size={18} decorative /> : null}
          <Text className={`text-body font-semibold ${LABEL[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
