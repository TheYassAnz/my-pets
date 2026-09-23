import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Nommage métier stable : les écrans demandent « paw », pas « md-paw-outline ».
// Changer de set d'icônes ne touchera que ce fichier.
const IONICONS = {
  home: 'home-outline',
  settings: 'settings-outline',
  camera: 'camera-outline',
  document: 'document-text-outline',
  bell: 'notifications-outline',
  add: 'add',
  close: 'close',
  chevron: 'chevron-forward',
  'chevron-left': 'chevron-back',
  'chevron-back': 'chevron-back',
  check: 'checkmark',
  alert: 'alert-circle-outline',
  refresh: 'refresh',
  trash: 'trash-outline',
  search: 'search-outline',
} as const;

const MATERIAL = {
  paw: 'paw',
  vaccine: 'needle',
  treatment: 'pill',
  visit: 'stethoscope',
} as const;

export type IconName = keyof typeof IONICONS | keyof typeof MATERIAL;

export type IconProps = {
  name: IconName;
  size?: number;
  /**
   * Couleur résolue (hex/rgb). Par défaut : `Colors[thème].text`.
   * `Text` (rendu interne de l'icône) n'hérite jamais de la couleur d'un
   * `View`/`Pressable` parent en React Native — sans valeur explicite,
   * `@expo/vector-icons` retombe sur son propre défaut ('black').
   */
  color?: string;
  /** Nom lu par VoiceOver/TalkBack. Requis si l'icône porte du sens. */
  label?: string;
  /** Icône purement visuelle : masquée aux lecteurs d'écran. */
  decorative?: boolean;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function Icon({ name, size = 20, color, label, decorative = false, testID }: IconProps) {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const resolvedColor = color ?? themeColors.text;

  const a11y = decorative
    ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
    : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label };

  if (name in MATERIAL) {
    return (
      <MaterialCommunityIcons
        name={MATERIAL[name as keyof typeof MATERIAL]}
        size={size}
        color={resolvedColor}
        testID={testID}
        {...a11y}
      />
    );
  }

  return (
    <Ionicons
      name={IONICONS[name as keyof typeof IONICONS]}
      size={size}
      color={resolvedColor}
      testID={testID}
      {...a11y}
    />
  );
}
