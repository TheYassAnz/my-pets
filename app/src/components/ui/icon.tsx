import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
  check: 'checkmark-circle-outline',
  alert: 'alert-circle-outline',
  refresh: 'refresh',
  trash: 'trash-outline',
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
  /** Couleur résolue (hex/rgb). Par défaut : hérite via className sur le parent. */
  color?: string;
  /** Nom lu par VoiceOver/TalkBack. Requis si l'icône porte du sens. */
  label?: string;
  /** Icône purement visuelle : masquée aux lecteurs d'écran. */
  decorative?: boolean;
};

export function Icon({ name, size = 20, color, label, decorative = false }: IconProps) {
  const a11y = decorative
    ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
    : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label };

  if (name in MATERIAL) {
    return (
      <MaterialCommunityIcons
        name={MATERIAL[name as keyof typeof MATERIAL]}
        size={size}
        color={color}
        {...a11y}
      />
    );
  }

  return (
    <Ionicons name={IONICONS[name as keyof typeof IONICONS]} size={size} color={color} {...a11y} />
  );
}
