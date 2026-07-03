import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, ApiError, type Animal } from '@/lib/api';

export default function AnimalsListScreen() {
  const [animals, setAnimals] = useState<Animal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(() => {
    api
      .listAnimals()
      .then(setAnimals)
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-8">
        <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
      </View>
    );
  }

  if (!animals) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 gap-3"
        ListEmptyComponent={
          <View className="items-center justify-center py-16 gap-2">
            <Text className="text-gray-500 dark:text-gray-400 text-center">
              Aucun animal pour le moment
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/animals/${item.id}`} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3 active:opacity-70">
              {item.photoUrl ? (
                <Image
                  source={{ uri: item.photoUrl }}
                  className="w-12 h-12 rounded-full"
                  contentFit="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
                  <Text className="text-lg">🐾</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-black dark:text-white font-semibold text-base">
                  {item.name}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.species}</Text>
              </View>
            </Pressable>
          </Link>
        )}
      />

      <Link href="/animals/new" asChild>
        <Pressable
          className="absolute right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center active:opacity-80"
          style={{ bottom: insets.bottom + 24 }}>
          <Text className="text-white text-2xl">+</Text>
        </Pressable>
      </Link>
    </View>
  );
}
