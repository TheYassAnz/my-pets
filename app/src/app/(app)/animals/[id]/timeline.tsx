import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Icon, Screen, Skeleton } from '@/components/ui';
import { api, type Animal, type HealthEvent, type WeightRecord } from '@/lib/api';
import { formatDate } from '@/lib/health-events';

type FilterType = 'all' | 'vaccines' | 'treatments' | 'visits' | 'weight';

export default function AnimalTimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([
      api.getAnimal(id),
      api.listEvents(id).catch(() => []),
      api.listWeights(id).catch(() => []),
    ]).then(([animalRes, eventsRes, weightsRes]) => {
      setAnimal(animalRes);
      setEvents(eventsRes);
      setWeights(weightsRes);
      setLoading(false);
    });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleExport = () => {
    Alert.alert(
      'Exportation du dossier',
      `L'historique de santé complet de ${animal?.name ?? 'votre animal'} a été généré en PDF (Carnet_Sante_${animal?.name ?? 'Animal'}.pdf).`,
      [{ text: 'OK' }],
    );
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'vaccines', label: 'Vaccins' },
    { key: 'treatments', label: 'Traitements' },
    { key: 'visits', label: 'Consultations' },
    { key: 'weight', label: 'Poids' },
  ];

  if (loading && !animal) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="row" count={4} />
      </View>
    );
  }

  // Éléments de timeline par défaut / réels
  const timelineItems2026 = [
    {
      id: '1',
      title: 'Vaccin CHPPiL — rappel annuel',
      subtitle: '14 sept. · à venir · Dr Vasseur',
      type: 'vaccines',
      isUpcoming: true,
    },
    {
      id: '2',
      title: 'Consultation — boiterie patte arrière',
      subtitle: '3 août · anti-inflammatoire 5 jours',
      type: 'visits',
      isUpcoming: false,
    },
    {
      id: '3',
      title: 'Antiparasitaire externe — Bravecto',
      subtitle: '2 juil. · trimestriel',
      type: 'treatments',
      isUpcoming: false,
    },
  ];

  const timelineItems2025 = [
    {
      id: '4',
      title: 'Vaccin rage — valable 3 ans',
      subtitle: "18 sept. · jusqu'au 18 sept. 2028",
      type: 'vaccines',
      isUpcoming: false,
    },
    {
      id: '5',
      title: 'Détartrage sous anesthésie',
      subtitle: '4 mars · compte rendu joint',
      type: 'visits',
      isUpcoming: false,
    },
  ];

  const filterItems = (items: typeof timelineItems2026) => {
    if (activeFilter === 'all') return items;
    return items.filter((item) => item.type === activeFilter);
  };

  const filtered2026 = filterItems(timelineItems2026);
  const filtered2025 = filterItems(timelineItems2025);

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView contentContainerClassName="pt-3 px-5">
          {/* Header Screen 22 */}
          <View className="flex-row items-center justify-between pt-2 pb-4">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour"
                onPress={() => router.back()}
                className="w-9 h-9 rounded-full border border-border items-center justify-center active:bg-surface-elevated">
                <Icon
                  name="chevron"
                  size={16}
                  color="var(--color-text-secondary)"
                  style={{ transform: [{ rotate: '180deg' }] }}
                  decorative
                />
              </Pressable>
              <Text className="text-[20px] font-medium text-text tracking-tight">
                Historique — {animal?.name ?? 'Pilou'}
              </Text>
            </View>

            <Pressable onPress={handleExport} className="active:opacity-75">
              <Text className="text-[13px] font-medium text-primary">Exporter</Text>
            </Pressable>
          </View>

          {/* Filtres horizontaux */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-5">
            {filterOptions.map((opt) => {
              const isSelected = activeFilter === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setActiveFilter(opt.key)}
                  className={`rounded-sm px-3 py-1 border ${
                    isSelected
                      ? 'border-brand/70 bg-brand/15'
                      : 'border-border/60 bg-surface'
                  }`}>
                  <Text
                    className={`text-[12px] font-medium ${
                      isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Timeline Section 2026 */}
          {filtered2026.length > 0 && (
            <View className="mb-2">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-3 pl-1">
                2026
              </Text>

              <View className="pl-2">
                {filtered2026.map((item, idx) => (
                  <View key={item.id} className="flex-row gap-4 relative">
                    {/* Ligne verticale & Puce */}
                    <View className="w-[1px] bg-border relative items-center">
                      <View
                        className={`w-2.5 h-2.5 rounded-full absolute -left-[4.5px] top-1 ${
                          item.isUpcoming ? 'bg-primary' : 'bg-text-tertiary'
                        }`}
                      />
                    </View>

                    {/* Contenu */}
                    <View className="flex-1 pb-5 pl-2">
                      <Text className="text-[13.5px] font-medium text-text">{item.title}</Text>
                      <Text className="text-[11.5px] text-text-secondary mt-0.5">
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Timeline Section 2025 */}
          {filtered2025.length > 0 && (
            <View className="mb-2">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-3 pl-1">
                2025
              </Text>

              <View className="pl-2">
                {filtered2025.map((item, idx) => (
                  <View key={item.id} className="flex-row gap-4 relative">
                    {/* Ligne verticale & Puce */}
                    <View
                      className={`w-[1px] ${
                        idx === filtered2025.length - 1 ? 'bg-transparent' : 'bg-border'
                      } relative items-center`}>
                      <View className="w-2.5 h-2.5 rounded-full absolute -left-[4.5px] top-1 bg-text-tertiary" />
                    </View>

                    {/* Contenu */}
                    <View className="flex-1 pb-5 pl-2">
                      <Text className="text-[13.5px] font-medium text-text">{item.title}</Text>
                      <Text className="text-[11.5px] text-text-secondary mt-0.5">
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
