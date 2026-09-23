import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, Text, useColorScheme, View } from 'react-native';

import { Card, Icon, Screen, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, type HouseholdMember, type HouseholdStats, type User } from '@/lib/api';
import { useSession } from '@/lib/auth-context';
import { useAppStore, type ThemePreference } from '@/lib/store/use-app-store';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { signOut } = useSession();
  const { themePreference, setThemePreference } = useAppStore();

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<HouseholdStats | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reminderNotifs, setReminderNotifs] = useState(true);
  const [eveningDigest, setEveningDigest] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
      api.me().catch(() => null),
      api.getHouseholdStats().catch(() => null),
      api.getHouseholdMembers().catch(() => []),
    ]).then(([userRes, statsRes, membersRes]) => {
      setUser(userRes);
      setStats(statsRes);
      setMembers(membersRes);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  if (loading && !stats) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" count={3} />
      </View>
    );
  }

  const displayName = user?.email
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
    : 'Camille Roux';

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerClassName="pt-3 px-5">
          {/* Header Profil (Screen 10) */}
          <View className="flex-row items-center gap-4 pt-2 mb-5">
            <View className="w-16 h-16 rounded-full bg-brand/20 border border-brand/40 items-center justify-center">
              <Text className="text-lg font-bold text-primary uppercase">
                {displayName[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-medium text-text tracking-tight">
                {displayName}
              </Text>
              <Text className="text-[13px] text-text-secondary mt-0.5">
                {user?.email ?? 'camille.roux@mail.fr'}
              </Text>
              <View className="self-start rounded-sm border border-brand/50 bg-brand/10 px-2 py-0.5 mt-2">
                <Text className="text-[11px] font-medium text-primary">
                  Administratrice du foyer
                </Text>
              </View>
            </View>
          </View>

          {/* 3 Compteurs du foyer */}
          <View className="flex-row gap-2.5 mb-5">
            <View className="flex-1 items-center p-3 rounded-md bg-surface border border-border/50 shadow-sm">
              <Text className="text-[19px] font-medium text-text">
                {stats?.animalsCount ?? 3}
              </Text>
              <Text className="text-[10px] font-semibold uppercase text-text-tertiary tracking-wider mt-0.5">
                Animaux
              </Text>
            </View>

            <View className="flex-1 items-center p-3 rounded-md bg-surface border border-border/50 shadow-sm">
              <Text className="text-[19px] font-medium text-text">
                {stats?.membersCount ?? 2}
              </Text>
              <Text className="text-[10px] font-semibold uppercase text-text-tertiary tracking-wider mt-0.5">
                Membres
              </Text>
            </View>

            <View className="flex-1 items-center p-3 rounded-md bg-surface border border-border/50 shadow-sm">
              <Text className="text-[19px] font-medium text-text">
                {stats?.remindersCount ?? 14}
              </Text>
              <Text className="text-[10px] font-semibold uppercase text-text-tertiary tracking-wider mt-0.5">
                Rappels
              </Text>
            </View>
          </View>

          {/* Section Foyer */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2 pl-0.5">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Foyer
              </Text>
              <Pressable onPress={() => router.push('/invitation')}>
                <Text className="text-[12px] font-medium text-primary">+ Inviter</Text>
              </Pressable>
            </View>

            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 overflow-hidden shadow-sm">
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className="w-7 h-7 rounded-full bg-brand/20 items-center justify-center">
                  <Text className="text-[11px] font-bold text-primary">C</Text>
                </View>
                <Text className="text-[14px] text-text flex-1 font-medium">Camille (vous)</Text>
                <Text className="text-[11px] text-text-secondary">Admin</Text>
              </View>
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className="w-7 h-7 rounded-full bg-surface-sunken items-center justify-center">
                  <Text className="text-[11px] font-bold text-text-secondary">L</Text>
                </View>
                <Text className="text-[14px] text-text flex-1 font-medium">Léa</Text>
                <Text className="text-[11px] text-text-secondary">Peut modifier</Text>
              </View>
            </View>
          </View>

          {/* Section Préférences (Screen 10) */}
          <View className="mb-5">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Préférences
            </Text>

            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 overflow-hidden shadow-sm">
              {/* Notifications */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-[14px] text-text">Notifications de rappel</Text>
                <Switch
                  value={reminderNotifs}
                  onValueChange={setReminderNotifs}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>

              {/* Résumé du soir */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-[14px] text-text">Résumé du soir</Text>
                <Switch
                  value={eveningDigest}
                  onValueChange={setEveningDigest}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>

              {/* Apparence : Clair / Sombre / Système */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-[14px] text-text">Apparence</Text>
                <View className="flex-row bg-surface-sunken rounded-full p-0.5 border border-border/40">
                  {(['light', 'dark', 'system'] as const).map((pref) => {
                    const labels: Record<ThemePreference, string> = {
                      light: 'Clair',
                      dark: 'Sombre',
                      system: 'Système',
                    };
                    const isSelected = themePreference === pref;
                    return (
                      <Pressable
                        key={pref}
                        onPress={() => setThemePreference(pref)}
                        className={`px-2.5 py-1 rounded-full ${
                          isSelected ? 'bg-brand/20 border border-brand/50' : ''
                        }`}>
                        <Text
                          className={`text-[11px] font-medium ${
                            isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                          }`}>
                          {labels[pref]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Unités */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-[14px] text-text">Unités</Text>
                <Text className="text-[13px] text-text-secondary">kg · g</Text>
              </View>

              {/* Clinique référente */}
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-[14px] text-text">Clinique référente</Text>
                <Text className="text-[13px] text-text-secondary">Dr Vasseur</Text>
              </View>
            </View>
          </View>

          {/* Liens Données & Partage */}
          <View className="mb-6 gap-2">
            <Pressable
              onPress={() => router.push('/account-data')}
              className="flex-row items-center justify-between p-3.5 rounded-md bg-surface border border-border/50 shadow-sm active:bg-surface-sunken">
              <Text className="text-[14px] font-medium text-text">Compte et données</Text>
              <Icon name="chevron" size={16} color="var(--color-text-tertiary)" decorative />
            </Pressable>

            <Pressable
              onPress={() => router.push('/share-record')}
              className="flex-row items-center justify-between p-3.5 rounded-md bg-surface border border-border/50 shadow-sm active:bg-surface-sunken">
              <Text className="text-[14px] font-medium text-text">Partager le carnet</Text>
              <Icon name="chevron" size={16} color="var(--color-text-tertiary)" decorative />
            </Pressable>
          </View>

          {/* Déconnexion */}
          <Pressable onPress={signOut} className="py-2.5 mb-8 items-center">
            <Text className="text-[13px] text-text-secondary underline">Se déconnecter</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    </View>
  );
}
