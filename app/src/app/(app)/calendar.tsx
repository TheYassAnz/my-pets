import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Icon, Screen, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, type AnimalWithUpcoming, type UpcomingHealthEvent } from '@/lib/api';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [animals, setAnimals] = useState<AnimalWithUpcoming[]>([]);
  const [events, setEvents] = useState<UpcomingHealthEvent[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<string>('Tous');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
      api.listAnimals().catch(() => []),
      api.listUpcomingEvents(180).catch(() => []),
    ]).then(([animalsRes, eventsRes]) => {
      setAnimals(animalsRes);
      setEvents(eventsRes);
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

  const filteredEvents =
    selectedAnimal === 'Tous'
      ? events
      : events.filter((e) => e.animalName === selectedAnimal);

  // Groupement par mois
  const groupedEvents = filteredEvents.reduce<Record<string, UpcomingHealthEvent[]>>(
    (acc, event) => {
      const date = new Date(event.nextDueDate);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'long' });
      const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
      if (!acc[capitalizedMonth]) acc[capitalizedMonth] = [];
      acc[capitalizedMonth].push(event);
      return acc;
    },
    {},
  );

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
          {/* Header Screen 6 */}
          <View className="pt-2 mb-4">
            <Text className="text-[26px] font-medium text-text tracking-tight">Agenda</Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">Tout le foyer</Text>
          </View>

          {/* Filtres par animal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-5">
            {['Tous', ...animals.map((a) => a.name)].map((animalName) => {
              const isSelected = selectedAnimal === animalName;
              return (
                <Pressable
                  key={animalName}
                  onPress={() => setSelectedAnimal(animalName)}
                  className={`rounded-sm px-3 py-1 border ${
                    isSelected
                      ? 'border-brand/70 bg-brand/15'
                      : 'border-border/60 bg-surface'
                  }`}>
                  <Text
                    className={`text-[12px] font-medium ${
                      isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                    {animalName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Groupes par mois */}
          {Object.keys(groupedEvents).length === 0 ? (
            <View className="p-5 rounded-lg bg-surface border border-border/50 items-center justify-center">
              <Text className="text-[13.5px] text-text-secondary text-center">
                Aucun rendez-vous planifié dans les 6 prochains mois.
              </Text>
            </View>
          ) : (
            Object.entries(groupedEvents).map(([month, monthItems], monthIdx) => (
              <View key={month} className="mb-5">
                <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-3 pl-0.5">
                  {month}
                </Text>

                <View className="gap-2.5">
                  {monthItems.map((item, idx) => {
                    const date = new Date(item.nextDueDate);
                    const dayNum = date.toLocaleDateString('fr-FR', { day: '2-digit' });
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                    const isFeatured = monthIdx === 0 && idx === 0;

                    if (isFeatured) {
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            router.push({
                              pathname: '/appointment-detail',
                              params: { title: item.title, animal: item.animalName },
                            })
                          }
                          className="active:opacity-85">
                          <View
                            style={{ backgroundColor: '#1d2042' }}
                            className="rounded-lg p-4 flex-row gap-3.5 items-start border border-border/40 shadow-sm">
                            <View className="w-11 items-center justify-center pt-0.5">
                              <Text className="text-[22px] font-medium text-white leading-tight">
                                {dayNum}
                              </Text>
                              <Text className="text-[10px] uppercase font-semibold text-primary tracking-wider">
                                {dayName}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-[15px] font-medium text-white">
                                {item.title}
                              </Text>
                              <Text className="text-[12px] text-text-secondary mt-0.5">
                                {date.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} · Dr Vasseur · {item.animalName}
                              </Text>
                              <Text className="text-[11px] text-text-tertiary mt-1.5">
                                Apporter le carnet papier
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    }

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          router.push({
                            pathname: '/appointment-detail',
                            params: { title: item.title, animal: item.animalName },
                          })
                        }
                        className="active:opacity-85">
                        <View className="flex-row gap-3.5 items-start p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                          <View className="w-11 items-center justify-center pt-0.5">
                            <Text className="text-[22px] font-medium text-text leading-tight">
                              {dayNum}
                            </Text>
                            <Text className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                              {dayName}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-[15px] font-medium text-text">{item.title}</Text>
                            <Text className="text-[12px] text-text-secondary mt-0.5">
                              {date.toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} · {item.animalName}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Screen>

      {/* FAB Ajouter un rdv */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nouveau rendez-vous"
        onPress={() => router.push('/animals')}
        className="absolute right-5 rounded-full border border-brand/70 bg-brand/15 items-center justify-center shadow-md active:opacity-75"
        style={{
          width: 52,
          height: 52,
          bottom: Math.max(insets.bottom + 64, 104),
        }}>
        <Icon name="add" size={24} color={colors.brand} decorative />
      </Pressable>
    </View>
  );
}
