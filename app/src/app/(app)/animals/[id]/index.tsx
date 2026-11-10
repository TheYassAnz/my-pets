import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Icon,
  Skeleton,
  Text,
  TypeIcon,
} from '@/components/ui';
import { computeAge, formatKg } from '@/lib/animals';
import { api, type Animal, type HealthEvent, type WeightRecord } from '@/lib/api';
import { daysUntil, deadlineState, formatDate } from '@/lib/health-events';
import {
  buildTimeline,
  filterTimeline,
  weightTrend,
  type TimelineEntry,
  type TimelineFilter,
  type TimelineKind,
} from '@/lib/timeline';

const FILTERS: { value: TimelineFilter; label: string }[] = [
  { value: 'ALL', label: 'Tout' },
  { value: 'VACCINE', label: 'Vaccins' },
  { value: 'CARE', label: 'Soins' },
  { value: 'VISIT', label: 'Visites' },
  { value: 'WEIGHT', label: 'Pesées' },
];

const KIND_LABEL: Record<TimelineKind, string> = {
  VACCINE: 'Vaccin',
  TREATMENT: 'Soin',
  VISIT: 'Visite',
  WEIGHT: 'Pesée',
};

function EntryRow({ entry, onPress }: { entry: TimelineEntry; onPress?: () => void }) {
  const { nextDueDate } = entry;
  const urgent = nextDueDate != null && deadlineState(daysUntil(nextDueDate)) !== 'ok';
  const label = [
    entry.kind === 'WEIGHT' ? entry.detail && `Pesée ${entry.detail}` : `${KIND_LABEL[entry.kind]} ${entry.title}`,
    formatDate(entry.date),
    nextDueDate && `prochain ${formatDate(nextDueDate)}`,
  ]
    .filter(Boolean)
    .join(', ');

  const content = (
    <>
      <TypeIcon type={entry.kind} />
      <View className="flex-1">
        <Text className="text-[17px] font-bold text-text">{entry.title}</Text>
        {entry.detail ? <Text className="text-[14px] text-text-secondary">{entry.detail}</Text> : null}
        {nextDueDate ? (
          <Text className={`text-[14px] ${urgent ? 'text-status-soon' : 'text-text-secondary'}`}>
            Prochain : {formatDate(nextDueDate)}
          </Text>
        ) : null}
      </View>
      <Text className="text-[14px] text-text-secondary">{formatDate(entry.date)}</Text>
    </>
  );
  const layout = 'min-h-11 flex-row items-center gap-3 border-b border-border py-3';

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} className={layout}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`${layout} active:bg-surface-sunken`}>
      {content}
    </Pressable>
  );
}

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TimelineFilter>('ALL');

  const load = useCallback(async () => {
    try {
      const [a, e, w] = await Promise.all([api.getAnimal(id), api.listEvents(id), api.listWeights(id)]);
      setAnimal(a);
      setEvents(e);
      setWeights(w);
      setError(false);
    } catch {
      setError(true);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const retry = () => {
    setError(false);
    setAnimal(null);
    load();
  };

  const all = useMemo(() => buildTimeline(events, weights), [events, weights]);
  const shown = useMemo(() => filterTimeline(all, filter), [all, filter]);

  let body;
  if (error && !animal) {
    body = <ErrorState message="Impossible de charger la fiche." onRetry={retry} />;
  } else if (!animal) {
    body = <Skeleton variant="row" count={4} />;
  } else {
    const { latestKg, deltaKg, since } = weightTrend(weights);
    const age = animal.birthDate ? computeAge(animal.birthDate.slice(0, 10)) : null;
    const month = since ? new Date(since).toLocaleDateString('fr-FR', { month: 'long' }) : null;
    const delta =
      deltaKg && month
        ? `${deltaKg > 0 ? '+' : '−'}${formatKg(Math.abs(deltaKg))} depuis ${month}`
        : null;

    body = (
      <>
        <View className="mb-5 flex-row items-center gap-4">
          <Avatar uri={animal.photoUrl} size="lg" />
          <View className="flex-1">
            <Text accessibilityRole="header" className="text-[30px] font-extrabold text-text">
              {animal.name}
            </Text>
            <Text className="text-[16px] text-text-secondary">
              {[animal.species, age].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
        <Text className="text-hero font-extrabold text-text">{formatKg(latestKg)}</Text>
        {delta ? (
          <Text className={`text-[15px] font-bold ${deltaKg! > 0 ? 'text-status-ok' : 'text-status-late'}`}>
            {delta}
          </Text>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 my-4 grow-0"
          contentContainerClassName="gap-2 px-5">
          {FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
        {error ? (
          <Text accessibilityRole="alert" className="mb-2 text-[14px] text-text-secondary">
            Impossible d&apos;actualiser. Réessayez.
          </Text>
        ) : null}
        {shown.length === 0 ? (
          <EmptyState
            icon="document"
            title="Aucune entrée"
            message={all.length === 0 ? `Ajoutez la première entrée de ${animal.name}.` : undefined}
          />
        ) : (
          shown.map((entry) => (
            <EntryRow
              key={`${entry.source}-${entry.id}`}
              entry={entry}
              onPress={
                entry.source === 'event'
                  ? () => router.push(`/animals/${id}/events/${entry.id}`)
                  : undefined
              }
            />
          ))
        )}
      </>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        testID="animal-scroll"
        contentContainerStyle={{ paddingTop: insets.top + 12 }}
        contentContainerClassName="px-5 pb-32"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface-sunken">
            <Icon name="chevron-back" size={22} decorative />
          </Pressable>
          {animal ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Modifier ${animal.name}`}
              hitSlop={8}
              onPress={() => router.push(`/animals/${id}/edit`)}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-sunken">
              <Icon name="edit" size={20} decorative />
            </Pressable>
          ) : null}
        </View>
        {body}
      </ScrollView>
      {animal ? (
        <View className="absolute inset-x-0 bottom-0 bg-surface px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button label="Ajouter une entrée" onPress={() => router.push(`/animals/${id}/events/new`)} />
        </View>
      ) : null}
    </View>
  );
}
