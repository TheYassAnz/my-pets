import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  ListRow,
  Skeleton,
  Text,
  TypeIcon,
} from '@/components/ui';
import { api, type UpcomingHealthEvent } from '@/lib/api';
import { daysUntil, deadlineState, formatDate } from '@/lib/health-events';

export default function UpcomingScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<UpcomingHealthEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setEvents(await api.listUpcomingEvents());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

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
    setEvents(null);
    load();
  };

  let body;
  if (error && !events?.length) {
    body = <ErrorState message="Impossible de charger les échéances." onRetry={retry} />;
  } else if (!events) {
    body = <Skeleton variant="row" count={4} />;
  } else if (events.length === 0) {
    body = <EmptyState icon="calendar" title="Aucune échéance dans les 3 prochains mois" />;
  } else {
    body = (
      <View>
        {events.map((e) => {
          const days = daysUntil(e.dueDate);
          return (
            <ListRow
              key={e.id}
              title={e.title}
              subtitle={`${e.animalName} · ${formatDate(e.dueDate)}`}
              leading={<TypeIcon type={e.type} />}
              trailing={
                <Badge
                  state={deadlineState(days)}
                  label={days === 0 ? 'Aujourd’hui' : `Dans ${days} j`}
                />
              }
              onPress={() => router.push(`/animals/${e.animalId}/events/${e.id}`)}
              className="border-b border-border"
            />
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
      contentContainerClassName="px-5 pb-36"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text accessibilityRole="header" className="mb-3 mt-2 text-[32px] font-extrabold text-text">
        À venir
      </Text>
      {error && events?.length ? (
        <Text accessibilityRole="alert" className="mb-2 text-[14px] text-text-secondary">
          Impossible d&apos;actualiser. Réessayez.
        </Text>
      ) : null}
      {body}
    </ScrollView>
  );
}
