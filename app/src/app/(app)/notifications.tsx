import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Icon, Screen } from '@/components/ui';

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  unread: boolean;
  section: 'today' | 'week';
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Vermifuge de Pilou à donner ce matin',
    subtitle: '08:00 · rappel de traitement',
    unread: true,
    section: 'today',
  },
  {
    id: '2',
    title: 'Léa a coché « Croquettes du matin » pour Pilou',
    subtitle: '07:42 · activité du foyer',
    unread: false,
    section: 'today',
  },
  {
    id: '3',
    title: 'Vaccin de Pilou lundi 14 à 09:30',
    subtitle: 'Mardi · rappel de rendez-vous',
    unread: false,
    section: 'week',
  },
  {
    id: '4',
    title: "Miso n'a pas été pesé depuis 10 jours",
    subtitle: 'Lundi · suivi de croissance',
    unread: false,
    section: 'week',
  },
  {
    id: '5',
    title: 'Ordonnance de Nala arrivée à échéance',
    subtitle: 'Dimanche · documents',
    unread: false,
    section: 'week',
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const todayNotifications = notifications.filter((n) => n.section === 'today');
  const weekNotifications = notifications.filter((n) => n.section === 'week');

  return (
    <View className="flex-1 bg-surface">
      <Screen scroll contentContainerClassName="pb-24">
        <ScrollView contentContainerClassName="pt-2 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-3 pb-4">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour"
                onPress={() => router.back()}
                className="w-9 h-9 rounded-full border border-border items-center justify-center active:bg-surface-elevated">
                <Icon name="chevron" size={16} color="var(--color-text-secondary)" decorative />
              </Pressable>
              <Text className="text-[26px] font-medium text-text tracking-tight">
                Notifications
              </Text>
            </View>

            <Pressable onPress={markAllAsRead}>
              <Text className="text-[13px] font-medium text-primary">Tout marquer lu</Text>
            </Pressable>
          </View>

          {/* Section Aujourd'hui */}
          {todayNotifications.length > 0 && (
            <View className="mt-2 mb-4">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2.5">
                Aujourd&apos;hui
              </Text>
              <View className="gap-2.5">
                {todayNotifications.map((item) => (
                  <View
                    key={item.id}
                    className={`flex-row items-start gap-3 p-3.5 rounded-lg bg-surface border ${
                      item.unread ? 'border-brand/40 bg-brand/5' : 'border-border/50'
                    }`}>
                    <View
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        item.unread ? 'bg-primary' : 'bg-text-tertiary'
                      }`}
                    />
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-medium text-text leading-snug">
                        {item.title}
                      </Text>
                      <Text className="text-[11.5px] text-text-secondary mt-1">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Section Cette semaine */}
          {weekNotifications.length > 0 && (
            <View className="mt-2 mb-4">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2.5">
                Cette semaine
              </Text>
              <View className="gap-2.5">
                {weekNotifications.map((item) => (
                  <View
                    key={item.id}
                    className={`flex-row items-start gap-3 p-3.5 rounded-lg bg-surface border ${
                      item.unread ? 'border-brand/40 bg-brand/5' : 'border-border/50'
                    }`}>
                    <View
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        item.unread ? 'bg-primary' : 'bg-text-tertiary'
                      }`}
                    />
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-medium text-text leading-snug">
                        {item.title}
                      </Text>
                      <Text className="text-[11.5px] text-text-secondary mt-1">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </Screen>
    </View>
  );
}
