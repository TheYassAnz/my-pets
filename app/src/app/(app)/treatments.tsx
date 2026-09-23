import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { Card, Icon, Screen, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, type Routine } from '@/lib/api';
import { formatDate } from '@/lib/health-events';

export default function TreatmentsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États locaux de bascule pour les traitements
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({
    milbemax: true,
    antipuces: true,
    articulaire: false,
  });

  const loadData = useCallback(() => {
    return api
      .listRoutines()
      .then(setRoutines)
      .catch(() => [])
      .finally(() => setLoading(false));
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

  const toggleSwitch = (key: string) => {
    setSwitchStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading && routines.length === 0) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" count={3} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerClassName="pt-3 px-5">
          {/* Navigation retour */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            className="flex-row items-center gap-1 pt-2 pb-3 active:opacity-75">
            <Icon
              name="chevron"
              size={16}
              color={colors.primary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
            <Text className="text-[13px] text-primary font-medium">Santé</Text>
          </Pressable>

          {/* En-tête Screen 7 */}
          <View className="mb-5">
            <Text className="text-[26px] font-medium text-text tracking-tight">Traitements</Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">
              Rappels récurrents du foyer
            </Text>
          </View>

          {/* Cartes des Traitements */}
          <View className="gap-3 mb-5">
            {/* Traitement 1 */}
            <View className="p-4 rounded-lg bg-surface border border-border/50 shadow-sm gap-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-medium text-text">Vermifuge — Milbemax</Text>
                <Switch
                  value={switchStates['milbemax']}
                  onValueChange={() => toggleSwitch('milbemax')}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
              <Text className="text-[12px] text-text-secondary">
                Pilou · tous les mois · 1 comprimé
              </Text>
              <View className="h-[3px] rounded-full bg-surface-sunken overflow-hidden my-1">
                <View style={{ width: '88%' }} className="h-full bg-primary rounded-full" />
              </View>
              <View className="flex-row justify-between items-center pt-0.5">
                <Text className="text-[11px] text-text-secondary">Dernier : 12 août</Text>
                <Text className="text-[11px] font-medium text-primary">Aujourd&apos;hui</Text>
              </View>
            </View>

            {/* Traitement 2 */}
            <View className="p-4 rounded-lg bg-surface border border-border/50 shadow-sm gap-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-medium text-text">Antipuces — pipette</Text>
                <Switch
                  value={switchStates['antipuces']}
                  onValueChange={() => toggleSwitch('antipuces')}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
              <Text className="text-[12px] text-text-secondary">
                Pilou, Nala, Miso · tous les 3 mois
              </Text>
              <View className="h-[3px] rounded-full bg-surface-sunken overflow-hidden my-1">
                <View style={{ width: '62%' }} className="h-full bg-primary rounded-full" />
              </View>
              <View className="flex-row justify-between items-center pt-0.5">
                <Text className="text-[11px] text-text-secondary">Dernier : 1er juil</Text>
                <Text className="text-[11px] text-text-secondary">1er oct</Text>
              </View>
            </View>

            {/* Traitement 3 (en pause) */}
            <View className="p-4 rounded-lg bg-surface border border-border/50 shadow-sm gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-medium text-text-secondary">
                  Complément articulaire
                </Text>
                <Switch
                  value={switchStates['articulaire']}
                  onValueChange={() => toggleSwitch('articulaire')}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
              <Text className="text-[12px] text-text-tertiary">
                Pilou · en pause depuis juin
              </Text>
            </View>
          </View>

          {/* Ligne de séparation */}
          <View className="h-[1px] bg-border my-2" />

          {/* Section Historique récent */}
          <View className="mt-3 mb-6">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-3 pl-0.5">
              Historique récent
            </Text>

            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 px-3.5">
              <View className="flex-row justify-between py-2.5">
                <Text className="text-[13px] text-text">Vermifuge — Pilou</Text>
                <Text className="text-[13px] text-text-secondary">12 août</Text>
              </View>
              <View className="flex-row justify-between py-2.5">
                <Text className="text-[13px] text-text">Antipuces — Nala</Text>
                <Text className="text-[13px] text-text-secondary">1er juil</Text>
              </View>
              <View className="flex-row justify-between py-2.5">
                <Text className="text-[13px] text-text">Vermifuge — Miso</Text>
                <Text className="text-[13px] text-text-secondary">28 juin</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}
