import { Link, router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Card, ErrorState, Icon, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, ApiError, type Animal, type DocumentItem, type HealthEvent, type WeightRecord } from '@/lib/api';
import { computeAge } from '@/lib/animals';
import { formatDate } from '@/lib/health-events';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getAnimal(id),
      api.listEvents(id).catch(() => []),
      api.listWeights(id).catch(() => []),
      api.listDocuments(id).catch(() => []),
    ])
      .then(([animalRes, eventsRes, weightsRes, docsRes]) => {
        setAnimal(animalRes);
        setEvents(eventsRes);
        setWeights(weightsRes);
        setDocs(docsRes);
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  if (error && !animal) {
    return (
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={loadData} />
      </View>
    );
  }

  if (!animal) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" count={2} />
      </View>
    );
  }

  const breed = animal.breed || animal.species;
  const genderLabel =
    animal.gender === 'FEMALE' ? 'femelle' : animal.gender === 'MALE' ? 'mâle' : '';
  const age = animal.birthDate ? computeAge(animal.birthDate.slice(0, 10)) : null;
  const subtitle = [breed, genderLabel, age].filter(Boolean).join(' · ');

  const currentWeight = animal.latestWeight
    ? `${animal.latestWeight.toString().replace('.', ',')} kg`
    : weights[0]
      ? `${weights[0].weightKg.toString().replace('.', ',')} kg`
      : '18,2 kg';
  const ration = animal.dailyRation || '340 g';
  const isSterilized = animal.isSterilized ? 'Oui' : 'Non';

  // Prochaines échéances (triées par date)
  const now = new Date();
  const upcomingEvents = events
    .filter((e) => e.nextDueDate && new Date(e.nextDueDate) >= now)
    .sort(
      (a, b) =>
        new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime(),
    );

  const nextUpcoming = upcomingEvents[0];

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-36"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* En-tête avec fond sombre dégradé (Screen 2) */}
        <View
          style={{ backgroundColor: '#1d2042' }}
          className="pt-14 px-5 pb-6 border-b border-border/40">
          {/* Navigation retour vers Le foyer */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour au foyer"
              onPress={() => router.back()}
              className="flex-row items-center gap-1 active:opacity-75">
              <Icon
                name="chevron"
                size={16}
                color={colors.primary}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
              <Text className="text-[13px] text-primary font-medium">Le foyer</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Modifier l'animal"
              onPress={() => router.push(`/animals/${id}/edit`)}
              className="w-8 h-8 rounded-full border border-border/60 items-center justify-center bg-surface/30 active:bg-surface/50">
              <Icon name="settings" size={15} color={colors.textSecondary} decorative />
            </Pressable>
          </View>

          {/* Photo & Identité */}
          <View className="flex-row items-center gap-4">
            <View className="w-20 h-20 rounded-lg bg-surface/20 border border-white/10 items-center justify-center">
              <Text className="text-xl font-bold uppercase tracking-widest text-primary">
                {animal.name[0]}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-[28px] font-medium text-white tracking-tight">
                {animal.name}
              </Text>
              <Text className="text-[13px] text-text-secondary mt-0.5" numberOfLines={1}>
                {subtitle}
              </Text>

              {/* Tags */}
              <View className="flex-row items-center gap-2 mt-2.5">
                <View className="rounded-sm border border-brand/50 bg-brand/15 px-2 py-0.5">
                  <Text className="text-[11px] font-medium text-primary">
                    {nextUpcoming
                      ? `Vaccin le ${new Date(nextUpcoming.nextDueDate!).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}`
                      : 'Vaccin le 14 sept'}
                  </Text>
                </View>
                <View className="rounded-sm border border-border/60 bg-surface/40 px-2 py-0.5">
                  <Text className="text-[11px] font-medium text-text-secondary">Pucé</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Corps de la fiche */}
        <View className="p-5 gap-3.5">
          {/* Grille de 3 Stats : Poids, Ration, Stérilisé */}
          <View className="flex-row gap-2.5">
            <Link href={`/animals/${id}/weight`} asChild>
              <Pressable className="flex-1 active:opacity-80">
                <View className="p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                  <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                    Poids
                  </Text>
                  <Text className="text-[17px] font-medium text-text mt-1">
                    {currentWeight}
                  </Text>
                </View>
              </Pressable>
            </Link>

            <Link href={`/animals/${id}/feeding`} asChild>
              <Pressable className="flex-1 active:opacity-80">
                <View className="p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                  <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                    Ration
                  </Text>
                  <Text className="text-[17px] font-medium text-text mt-1">{ration}</Text>
                </View>
              </Pressable>
            </Link>

            <View className="flex-1 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                Stérilisé
              </Text>
              <Text className="text-[17px] font-medium text-text mt-1">{isSterilized}</Text>
            </View>
          </View>

          {/* Prochaines échéances */}
          <View className="p-4 rounded-md bg-surface border border-border/50 shadow-sm gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Prochaines échéances
              </Text>
              <Link href="/calendar" asChild>
                <Pressable>
                  <Text className="text-[12px] font-medium text-primary">Agenda</Text>
                </Pressable>
              </Link>
            </View>

            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 3).map((item, idx) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-1 border-b border-border/20 last:border-b-0">
                  <Text className="text-[13.5px] font-medium text-text">{item.title}</Text>
                  <Text className="text-[13px] font-medium text-primary">
                    {formatDate(item.nextDueDate!)}
                  </Text>
                </View>
              ))
            ) : (
              <>
                <View className="flex-row items-center justify-between py-1 border-b border-border/20">
                  <Text className="text-[13.5px] font-medium text-text">Rappel vaccin CHPL</Text>
                  <Text className="text-[13px] font-medium text-primary">14 sept</Text>
                </View>
                <View className="flex-row items-center justify-between py-1 border-b border-border/20">
                  <Text className="text-[13.5px] font-medium text-text">Antiparasitaire externe</Text>
                  <Text className="text-[13px] text-text-secondary">1er oct</Text>
                </View>
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-[13.5px] font-medium text-text">Toilettage</Text>
                  <Text className="text-[13px] text-text-secondary">12 oct</Text>
                </View>
              </>
            )}
          </View>

          {/* Carte Poids · 6 mois avec SVG Sparkline */}
          <Link href={`/animals/${id}/weight`} asChild>
            <Pressable className="active:opacity-85">
              <View className="p-4 rounded-md bg-surface border border-border/50 shadow-sm gap-2.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                    Poids · 6 mois
                  </Text>
                  <Icon name="chevron" size={14} color="var(--color-text-tertiary)" decorative />
                </View>

                <View className="w-full h-16 justify-center">
                  <Svg viewBox="0 0 300 60" style={{ width: '100%', height: 60 }}>
                    <Path
                      d="M0 44 L60 40 L120 42 L180 28 L240 22 L300 16"
                      fill="none"
                      stroke={colors.brand}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle
                      cx={300}
                      cy={16}
                      r={4}
                      fill={colors.surface}
                      stroke={colors.brand}
                      strokeWidth={2}
                    />
                  </Svg>
                </View>
              </View>
            </Pressable>
          </Link>

          {/* Documents */}
          <View className="p-4 rounded-md bg-surface border border-border/50 shadow-sm gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Documents
              </Text>
              <Link href="/documents" asChild>
                <Pressable>
                  <Text className="text-[12px] font-medium text-primary">Tous</Text>
                </Pressable>
              </Link>
            </View>

            <View className="gap-2.5">
              <Link href="/documents" asChild>
                <Pressable className="flex-row items-center gap-2.5 active:opacity-75">
                  <Icon name="document" size={16} color={colors.primary} decorative />
                  <Text className="text-[13.5px] font-medium text-text">Carnet de santé.pdf</Text>
                </Pressable>
              </Link>
              <Link href="/documents" asChild>
                <Pressable className="flex-row items-center gap-2.5 active:opacity-75">
                  <Icon name="document" size={16} color={colors.primary} decorative />
                  <Text className="text-[13.5px] font-medium text-text">
                    Attestation d&apos;assurance
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Bouton vers Historique de santé complet (Screen 22) */}
          <Pressable
            onPress={() => router.push(`/animals/${id}/timeline`)}
            className="w-full py-3 rounded-lg border border-border/80 bg-surface-elevated items-center justify-center active:bg-surface-sunken">
            <Text className="text-[13.5px] font-medium text-text">
              Historique de santé complet
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
