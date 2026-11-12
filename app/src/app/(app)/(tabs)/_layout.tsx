import { Tabs } from 'expo-router';

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textTertiary,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
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
