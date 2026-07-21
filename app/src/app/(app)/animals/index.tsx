import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, EmptyState, ErrorState, FAB, ListRow, Skeleton } from '@/components/ui';
import { api, ApiError, type Animal } from '@/lib/api';

export default function AnimalsListScreen() {
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
    return api
      .listAnimals()
      .then(setAnimals)
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error) {
    return (
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!animals) {
    return (
      <View className="flex-1 bg-surface p-4">
        <Skeleton variant="row" count={4} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="paw"
            title="Aucun animal"
            message="Ajoutez votre premier compagnon pour commencer son carnet."
            actionLabel="Ajouter un animal"
            onAction={() => router.push('/animals/new')}
          />
        }
        renderItem={({ item }) => (
          <Link href={`/animals/${item.id}`} asChild>
            <ListRow
              leading={<Avatar uri={item.photoUrl} label={item.name} />}
              title={item.name}
              subtitle={item.species}
            />
          </Link>
        )}
      />

      <View className="absolute right-6" style={{ bottom: insets.bottom + 24 }}>
        <FAB
          icon="add"
          label="Ajouter un animal"
          onPress={() => router.push('/animals/new')}
          testID="add-animal-fab"
        />
      </View>
    </View>
  );
}
