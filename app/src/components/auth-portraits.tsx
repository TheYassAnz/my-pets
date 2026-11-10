import { View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Icon } from '@/components/ui';
import { Colors } from '@/constants/theme';

// Trois pastilles décoratives qui se chevauchent (maquette F, écran 1).
// Avatar n'a pas de taille 76 ni de fond coloré : on pose directement l'icône patte.
export function AuthPortraits() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const items = [
    { bg: 'bg-type-vaccine', fg: colors.typeVaccineFg },
    { bg: 'bg-type-visit', fg: colors.typeVisitFg },
    { bg: 'bg-type-weight', fg: colors.typeWeightFg },
  ];

  return (
    <View className="flex-row mb-6" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {items.map((it, i) => (
        <View
          key={it.bg}
          style={{ width: 76, height: 76, borderRadius: 38, marginLeft: i === 0 ? 0 : -16 }}
          className={`items-center justify-center border-[3px] border-surface ${it.bg}`}>
          <Icon name="paw" size={32} color={it.fg} decorative />
        </View>
      ))}
    </View>
  );
}
