import { Pressable, Text, View } from 'react-native';

import { useSession } from '@/lib/auth-context';

export default function HomeScreen() {
  const { user, signOut } = useSession();

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black gap-4 px-8">
      <Text className="text-3xl font-bold text-black dark:text-white">my-pets 🐾</Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        carnet de santé numérique
      </Text>

      <View className="mt-6 rounded-xl bg-green-100 dark:bg-green-900 px-6 py-4 items-center gap-1">
        <Text className="text-green-800 dark:text-green-200 font-semibold">Connecté ✓</Text>
        <Text className="text-green-700 dark:text-green-300 text-sm">{user?.email}</Text>
      </View>

      <Text className="text-gray-400 dark:text-gray-500 text-sm text-center mt-2">
        Vos animaux apparaîtront ici (Phase 2)
      </Text>

      <Pressable
        className="mt-8 rounded-xl border border-red-300 dark:border-red-800 px-6 py-3 active:opacity-70"
        onPress={signOut}>
        <Text className="text-red-600 dark:text-red-400 font-semibold">Se déconnecter</Text>
      </Pressable>
    </View>
  );
}
