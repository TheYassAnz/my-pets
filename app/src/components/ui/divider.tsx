import { View } from 'react-native';

/**
 * Filet de séparation — 1px entre les sections, pas sur le premier ni le dernier.
 * Le `border` de la carte est supprimé, seule cette ligne reste.
 */
export function Divider() {
  return <View className="border-b border-border h-px" />;
}
