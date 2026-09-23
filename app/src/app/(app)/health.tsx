import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Button, Card, Icon, Screen, Skeleton } from '@/components/ui';
import { api, type AnimalWithUpcoming, type HealthEvent, type HealthEventType } from '@/lib/api';
import { formatDate } from '@/lib/health-events';
import { useAppStore } from '@/lib/store/use-app-store';

export default function HealthScreen() {
  const { selectedAnimalId, setSelectedAnimalId } = useAppStore();
  const [animals, setAnimals] = useState<AnimalWithUpcoming[]>([]);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'vaccines' | 'treatments' | 'visits'>('vaccines');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    return api
      .listAnimals()
      .then((animalsRes) => {
        setAnimals(animalsRes);
        const targetId = selectedAnimalId ?? animalsRes[0]?.id;
        if (targetId) {
          if (!selectedAnimalId) setSelectedAnimalId(targetId);
          return api.listEvents(targetId);
        }
        return [];
      })
      .then((eventsRes) => {
        setEvents(eventsRes);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedAnimalId, setSelectedAnimalId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId) ?? animals[0];

  const filterTypeMap: Record<'vaccines' | 'treatments' | 'visits', HealthEventType> = {
    vaccines: 'VACCINE',
    treatments: 'TREATMENT',
    visits: 'VISIT',
  };

  const filteredEvents = events.filter((e) => e.type === filterTypeMap[activeTab]);

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
          {/* Header Screen 4 */}
          <View className="pt-2 mb-4">
            <Text className="text-[26px] font-medium text-text tracking-tight">Santé</Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">
              {selectedAnimal ? `${selectedAnimal.name} · carnet synchronisé` : 'Carnet synchronisé'}
            </Text>
          </View>

          {/* Sélecteur d'animaux */}
          {animals.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pb-4">
              {animals.map((a) => {
                const isSelected = selectedAnimal?.id === a.id;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => setSelectedAnimalId(a.id)}
                    className={`rounded-full px-3.5 py-1.5 border ${
                      isSelected
                        ? 'border-brand/60 bg-surface-elevated shadow-sm'
                        : 'border-border/60 bg-surface'
                    }`}>
                    <Text
                      className={`text-[12.5px] font-medium ${
                        isSelected ? 'text-text' : 'text-text-secondary'
                      }`}>
                      {a.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Onglets Vaccins / Traitements / Visites */}
          <View className="flex-row bg-surface rounded-md p-1 border border-border/40 mb-4">
            {(['vaccines', 'treatments', 'visits'] as const).map((tabKey) => {
              const labels = {
                vaccines: 'Vaccins',
                treatments: 'Traitements',
                visits: 'Visites',
              };
              const isSelected = activeTab === tabKey;
              return (
                <Pressable
                  key={tabKey}
                  onPress={() => setActiveTab(tabKey)}
                  className={`flex-1 py-2 rounded items-center ${
                    isSelected ? 'border border-brand/70 bg-brand/10' : ''
                  }`}>
                  <Text
                    className={`text-[12.5px] font-medium ${
                      isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                    {labels[tabKey]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Liste des événements de santé */}
          <View className="gap-2.5 mb-5">
            {filteredEvents.length === 0 ? (
              <Card elevated className="p-4 items-center justify-center">
                <Text className="text-caption text-text-secondary">
                  Aucun élément enregistré dans cette catégorie
                </Text>
              </Card>
            ) : (
              filteredEvents.map((e) => {
                const isUpcoming = e.nextDueDate && new Date(e.nextDueDate) >= new Date();
                const dateLabel = isUpcoming
                  ? `Prévu le ${formatDate(e.nextDueDate!)}`
                  : `Fait le ${formatDate(e.date)}`;

                return (
                  <View
                    key={e.id}
                    className="flex-row items-center gap-3 py-3.5 px-4 rounded-md bg-surface border border-border/50 shadow-sm">
                    <View
                      className={`w-2 h-2 rounded-full ${
                        isUpcoming ? 'bg-primary' : 'bg-text-tertiary'
                      }`}
                    />
                    <View className="flex-1">
                      <Text className="text-[14px] font-medium text-text">{e.title}</Text>
                      <Text className="text-[11px] text-text-secondary mt-0.5">{dateLabel}</Text>
                    </View>
                    <View
                      className={`rounded-sm px-2 py-0.5 border ${
                        isUpcoming
                          ? 'border-brand/40 bg-brand/10'
                          : 'border-border/60 bg-surface-sunken'
                      }`}>
                      <Text
                        className={`text-[11px] font-medium ${
                          isUpcoming ? 'text-primary' : 'text-text-secondary'
                        }`}>
                        {isUpcoming ? 'À venir' : 'Valide'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Carte Clinique Référente */}
          <View className="p-4 rounded-md bg-surface border border-border/50 shadow-sm gap-2 mb-4">
            <Text className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
              Clinique référente
            </Text>
            <Text className="text-[14px] font-medium text-text">
              Dr Vasseur — Clinique des Lilas
            </Text>
            <Text className="text-[12px] text-text-secondary leading-relaxed">
              14 rue des Lilas, Lyon 3e · 04 78 22 41 09
            </Text>
            <View className="flex-row gap-2.5 mt-2">
              <Button
                variant="primary"
                size="sm"
                onPress={() => Linking.openURL('tel:0478224109')}
                className="flex-1">
                Appeler
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onPress={() =>
                  Linking.openURL(
                    'https://maps.apple.com/?q=Clinique+Vétérinaire+des+Lilas+Lyon',
                  )
                }
                className="flex-1">
                Itinéraire
              </Button>
            </View>
          </View>

          {/* Note d'information */}
          <Text className="text-[11px] text-text-tertiary text-center px-4 leading-relaxed mb-6">
            Le carnet numérique se met à jour après chaque visite validée par la clinique.
          </Text>
        </ScrollView>
      </Screen>
    </View>
  );
}
