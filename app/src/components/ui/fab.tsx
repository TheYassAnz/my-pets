import { type StyleProp, type ViewStyle, Pressable, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

import { Icon, type IconName } from './icon';

export type FABProps = {
  icon: IconName;
  /** Nom lu par les lecteurs d'écran — obligatoire, le FAB n'a pas de texte. */
  label: string;
  onPress: () => void;
  /**
   * Fusionnée en dernier dans la classe du conteneur — c'est le seul moyen de
   * positionner le FAB : le `style` interne (ombre) reste géré par le composant.
   */
  className?: string;
  /** Styles additionnels (notamment pour le positionnement dynamique avec Safe Area) */
  style?: StyleProp<ViewStyle>;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
  /** Style du FAB : 'nocturne' (translucide avec bordure marque Museau) ou 'primary' */
  variant?: 'primary' | 'nocturne';
};

export function FAB({
  icon,
  label,
  onPress,
  className,
  style,
  testID,
  variant = 'nocturne',
}: FABProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isNocturne = variant === 'nocturne';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={[
        isNocturne
          ? {
              shadowColor: colors.brand,
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }
          : {
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            },
        style,
      ]}
      className={`${
        isNocturne
          ? 'h-[52px] w-[52px] items-center justify-center rounded-full border border-brand bg-brand/15 active:bg-brand/25'
          : 'h-14 w-14 items-center justify-center rounded-full bg-primary active:bg-primary-pressed'
      } ${className ?? ''}`}
    >
      <Icon
        name={icon}
        size={24}
        decorative
        color={isNocturne ? colors.brand : colors.onPrimary}
      />
    </Pressable>
  );
}
