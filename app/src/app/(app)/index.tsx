import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  EmptyState,
  ErrorState,
  Icon,
  ListRow,
  Skeleton,
  Text,
} from '@/components/ui';
import { computeAge, formatKg } from '@/lib/animals';
import { api, type AnimalWithUpcoming } from '@/lib/api';
import { useSession } from '@/lib/auth-context';

export default function MyAnimalsScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const [animals, setAnimals] = useState<AnimalWithUpcoming[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setAnimals(await api.listAnimals());
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
    setAnimals(null);
    load();
  };

  const confirmSignOut = () =>
    Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () =>
          signOut().catch(() =>
            Alert.alert(
              'Déconnexion impossible',
              'Déconnexion impossible. Vérifiez votre connexion et réessayez.',
            ),
          ),
      },
    ]);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  let body;
  if (error && !animals?.length) {
    body = <ErrorState message="Impossible de charger vos animaux." onRetry={retry} />;
  } else if (!animals) {
    body = <Skeleton variant="row" count={4} />;
  } else if (animals.length === 0) {
    body = (
      <EmptyState
        icon="paw"
        title="Ajoutez votre premier animal"
        actionLabel="Ajouter un animal"
        onAction={() => router.push('/animals/new')}
      />
    );
  } else {
    body = (
      <View>
        {animals.map((a) => {
          const age = a.birthDate ? computeAge(a.birthDate.slice(0, 10)) : null;
          const subtitle = [a.species, age].filter(Boolean).join(' · ');
          const weight = formatKg(a.latestWeight);
          return (
            <ListRow
              key={a.id}
              title={a.name}
              subtitle={subtitle}
              leading={<Avatar uri={a.photoUrl} size="md" />}
              trailing={
                <Text
                  className={
                    a.latestWeight != null
                      ? 'text-[15px] font-bold text-text'
                      : 'text-[15px] text-text-tertiary'
                  }>
                  {weight}
                </Text>
              }
              accessibilityLabel={[a.name, a.species.toLowerCase(), age, a.latestWeight != null && weight]
                .filter(Boolean)
                .join(', ')}
              onPress={() => router.push(`/animals/${a.id}`)}
              className="border-b border-border"
            />
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un animal"
          onPress={() => router.push('/animals/new')}
          className="min-h-11 flex-row items-center gap-3 p-3 active:bg-surface-sunken">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-surface-sunken">
            <Icon name="add" size={26} decorative />
          </View>
          <Text className="text-[17px] font-bold text-text-secondary">Ajouter un animal</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      testID="animals-scroll"
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
      contentContainerClassName="px-5 pb-36"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View className="flex-row justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compte et déconnexion"
          hitSlop={8}
          onPress={confirmSignOut}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface-sunken">
          <Text className="text-[16px] font-bold text-text">{initial}</Text>
        </Pressable>
      </View>
      <Text accessibilityRole="header" className="mb-3 mt-2 text-[32px] font-extrabold text-text">
        Mes animaux
      </Text>
      {error && animals?.length ? (
        <Text accessibilityRole="alert" className="mb-2 text-[14px] text-text-secondary">
          Impossible d&apos;actualiser. Réessayez.
        </Text>
      ) : null}
      {body}
    </ScrollView>
  );
}
