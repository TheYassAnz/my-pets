import { Pressable, useColorScheme } from 'react-native';

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
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function FAB({ icon, label, onPress, className, testID }: FABProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      // Élévation Material 3 : ombre portée + surface primaire.
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
      className={`h-14 w-14 items-center justify-center rounded-full bg-primary active:bg-primary-pressed ${className ?? ''}`}>
      {/* Le FAB est toujours une surface primaire : l'icône suit `onPrimary`, comme le libellé du Button primary. */}
      <Icon name={icon} size={26} decorative color={colors.onPrimary} />
    </Pressable>
  );
}
