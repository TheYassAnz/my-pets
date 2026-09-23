import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Card, Icon, Screen, Skeleton } from '@/components/ui';
import { api, type AnimalWithUpcoming, type HouseholdMember } from '@/lib/api';
import { computeAge } from '@/lib/animals';
import { daysUntil, formatDate } from '@/lib/health-events';

export default function FoyerScreen() {
  const [animals, setAnimals] = useState<AnimalWithUpcoming[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
      api.listAnimals().catch(() => []),
      api.getHouseholdMembers().catch(() => []),
    ]).then(([animalsRes, membersRes]) => {
      setAnimals(animalsRes);
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

  const otherMembers = members.filter((m) => !m.isOwner);
  const membersSubtitle =
    otherMembers.length > 0
      ? `partagé avec ${otherMembers.map((m) => m.name).join(', ')}`
      : 'foyer individuel';

  if (loading && animals.length === 0) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="row" count={4} />
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
          {/* En-tête Foyer (Screen 3) */}
          <View className="mb-5 pt-2">
            <Text className="text-[26px] font-medium text-text tracking-tight">Le foyer</Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">
              {animals.length} {animals.length > 1 ? 'animaux' : 'animal'} · {membersSubtitle}
            </Text>
          </View>

          {/* Cartes animaux */}
          <View className="gap-3 mb-4">
            {animals.map((item, index) => {
              const age = item.birthDate ? computeAge(item.birthDate.slice(0, 10)) : null;
              const subtitle = [item.breed || item.species, age].filter(Boolean).join(' · ');
              const days = item.nextDueDate ? daysUntil(item.nextDueDate) : null;
              const weightStr = item.latestWeight ? `${item.latestWeight} kg` : null;

              // Formatage du statut vaccin/croissance
              let statusLabel = 'À jour';
              let isAccentStatus = false;

              if (days !== null && days <= 30) {
                statusLabel = item.nextDueDate
                  ? `Vaccin ${new Intl.DateTimeFormat('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    }).format(new Date(item.nextDueDate))}`
                  : `Vaccin ${days} j`;
                isAccentStatus = true;
              } else if (age && (age.includes('mois') || age.includes('1 an'))) {
                statusLabel = 'En croissance';
                isAccentStatus = index % 2 === 0;
              }

              return (
                <Link key={item.id} href={`/animals/${item.id}`} asChild>
                  <Pressable className="active:opacity-80">
                    <View className="flex-row items-center gap-3.5 p-3.5 rounded-lg bg-surface border border-border/50 shadow-sm">
                      {/* Vignette photo / monogramme */}
                      <View
                        className={`w-14 h-14 rounded-md items-center justify-center ${
                          index === 0 ? 'bg-brand/20' : 'bg-surface-sunken'
                        }`}>
                        <Text
                          className={`text-sm font-bold uppercase tracking-wider ${
                            index === 0 ? 'text-brand' : 'text-text-secondary'
                          }`}>
                          {item.name[0]}
                        </Text>
                      </View>

                      {/* Infos animal */}
                      <View className="flex-1">
                        <Text className="text-[17px] font-medium text-text">{item.name}</Text>
                        <Text className="text-[12px] text-text-secondary mt-0.5">{subtitle}</Text>

                        {/* Tags */}
                        <View className="flex-row items-center gap-2 mt-2">
                          {weightStr && (
                            <View className="rounded-sm bg-surface-sunken px-2 py-0.5 border border-border/60">
                              <Text className="text-[11px] text-text-secondary font-medium">
                                {weightStr}
                              </Text>
                            </View>
                          )}
                          <View
                            className={`rounded-sm px-2 py-0.5 border ${
                              isAccentStatus
                                ? 'border-brand/40 bg-brand/15'
                                : 'border-border/60 bg-surface-sunken'
                            }`}>
                            <Text
                              className={`text-[11px] font-medium ${
                                isAccentStatus ? 'text-brand' : 'text-text-secondary'
                              }`}>
                              {statusLabel}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Icon name="chevron" size={18} color="var(--color-text-tertiary)" />
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </View>

          {/* Bouton d'ajout animal dashed */}
          <Pressable
            onPress={() => router.push('/animals/new')}
            className="w-full h-12 rounded-lg border border-dashed border-border items-center justify-center mb-5 active:bg-surface-elevated">
            <Text className="text-[13.5px] font-medium text-text-secondary">
              + Ajouter un animal
            </Text>
          </Pressable>

          {/* Ligne de séparation */}
          <View className="h-[1px] bg-border my-2" />

          {/* Section Membres du foyer */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Membres du foyer
              </Text>
              <Pressable onPress={() => router.push('/invitation')}>
                <Text className="text-[12.5px] font-medium text-primary">+ Inviter</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              {members.map((m) => (
                <View
                  key={m.id}
                  className="flex-1 flex-row items-center gap-2.5 p-3 rounded-md bg-surface border border-border/40 shadow-sm">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      m.isOwner ? 'bg-brand/20' : 'bg-surface-sunken'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        m.isOwner ? 'text-brand' : 'text-text-secondary'
                      }`}>
                      {m.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13px] font-medium text-text" numberOfLines={1}>
                      {m.name}
                    </Text>
                    <Text className="text-[11px] text-text-secondary">
                      {m.isOwner ? 'Propriétaire' : m.role}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}
