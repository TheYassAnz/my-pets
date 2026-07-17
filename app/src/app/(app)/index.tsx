import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSession } from '@/lib/auth-context';
import { AI_EXTRACTION_ENABLED } from '@/lib/features';
import { getToken, setToken } from '@/lib/token-storage';

const ONBOARDING_SEEN_KEY = 'mypets.onboardingSeen';

const ONBOARDING_STEPS = [
  {
    emoji: '🐾',
    title: 'Ajoutez vos animaux',
    text: 'Créez une fiche par animal avec sa photo, son espèce et sa date de naissance.',
  },
  ...(AI_EXTRACTION_ENABLED
    ? [
        {
          emoji: '📷',
          title: 'Scannez vos documents',
          text: "Photographiez une ordonnance ou le carnet papier : l'IA pré-remplit l'événement, vous validez.",
        },
      ]
    : [
        {
          emoji: '📝',
          title: 'Tenez le carnet à jour',
          text: 'Ajoutez vaccins, traitements et visites en quelques secondes.',
        },
      ]),
  {
    emoji: '🔔',
    title: 'Ne ratez plus un rappel',
    text: 'Recevez une notification avant chaque échéance de vaccin ou de traitement.',
  },
];

export default function HomeScreen() {
  const { user, signOut } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    getToken(ONBOARDING_SEEN_KEY).then((seen) => {
      if (!seen) setShowOnboarding(true);
    });
  }, []);

  const dismissOnboarding = async () => {
    setShowOnboarding(false);
    await setToken(ONBOARDING_SEEN_KEY, '1');
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="flex-grow items-center justify-center gap-4 px-8 py-12">
      <Text className="text-3xl font-bold text-black dark:text-white">my-pets 🐾</Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400">
        carnet de santé numérique
      </Text>

      {showOnboarding ? (
        <View className="mt-4 w-full rounded-2xl border border-gray-200 dark:border-gray-800 p-5 gap-4">
          <Text className="text-lg font-bold text-black dark:text-white">
            Bienvenue !
          </Text>
          {ONBOARDING_STEPS.map((step) => (
            <View key={step.title} className="flex-row gap-3">
              <Text className="text-2xl">{step.emoji}</Text>
              <View className="flex-1">
                <Text className="font-semibold text-black dark:text-white">
                  {step.title}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {step.text}
                </Text>
              </View>
            </View>
          ))}
          <Link href="/animals/new" asChild>
            <Pressable
              className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80"
              onPress={dismissOnboarding}>
              <Text className="text-white font-semibold">
                Ajouter mon premier animal
              </Text>
            </Pressable>
          </Link>
          <Pressable className="items-center py-1 active:opacity-70" onPress={dismissOnboarding}>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">Plus tard</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-6 rounded-xl bg-green-100 dark:bg-green-900 px-6 py-4 items-center gap-1">
          <Text className="text-green-800 dark:text-green-200 font-semibold">
            Connecté ✓
          </Text>
          <Text className="text-green-700 dark:text-green-300 text-sm">{user?.email}</Text>
        </View>
      )}

      <Pressable
        className="mt-8 rounded-xl border border-red-300 dark:border-red-800 px-6 py-3 active:opacity-70"
        onPress={signOut}>
        <Text className="text-red-600 dark:text-red-400 font-semibold">Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}
