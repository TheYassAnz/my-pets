import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type HealthStatus = { status: string; db: boolean } | null;

export default function HomeScreen() {
  const [health, setHealth] = useState<HealthStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      setHealth(null);
      setLoading(false);
      return;
    }
    fetch(`${apiUrl}/`)
      .then((r) => r.json())
      .then((data: HealthStatus) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black gap-4">
      <Text className="text-3xl font-bold text-black dark:text-white">my-pets 🐾</Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400">carnet de santé numérique</Text>

      {loading ? (
        <ActivityIndicator />
      ) : health ? (
        <View className="mt-6 rounded-xl bg-green-100 dark:bg-green-900 px-6 py-4 items-center gap-1">
          <Text className="text-green-800 dark:text-green-200 font-semibold">API connectée ✓</Text>
          <Text className="text-green-700 dark:text-green-300 text-sm">
            base de données : {health.db ? '✓' : '✗'}
          </Text>
        </View>
      ) : (
        <View className="mt-6 rounded-xl bg-orange-100 dark:bg-orange-900 px-6 py-4 items-center gap-1">
          <Text className="text-orange-800 dark:text-orange-200 font-semibold">
            API non configurée
          </Text>
          <Text className="text-orange-700 dark:text-orange-300 text-sm">
            Définir EXPO_PUBLIC_API_URL dans .env
          </Text>
        </View>
      )}
    </View>
  );
}
