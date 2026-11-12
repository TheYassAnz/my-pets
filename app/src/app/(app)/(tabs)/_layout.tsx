import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Animaux', icon: 'paw' },
  { name: 'upcoming', title: 'À venir', icon: 'calendar' },
  { name: 'account', title: 'Compte', icon: 'person' },
];

export default function TabsLayout() {
  const c = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textTertiary,
        // Hauteur fixe : react-navigation n'ajoute plus l'inset bas, d'où le + insets.bottom.
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 64 + insets.bottom },
        // lineHeight explicite : en « normal », le libellé (overflow hidden) coupe les jambages (« p » de Compte).
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, lineHeight: 16 },
      }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ color, size }) => <Icon name={icon} color={String(color)} size={size} decorative />,
          }}
        />
      ))}
    </Tabs>
  );
}
