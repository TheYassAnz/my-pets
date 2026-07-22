import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, Icon, type IconName } from '@/components/ui';
import { AI_EXTRACTION_ENABLED } from '@/lib/features';
import { getToken, setToken } from '@/lib/token-storage';

const ONBOARDING_SEEN_KEY = 'mypets.onboardingSeen';

const ONBOARDING_STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'paw',
    title: 'Ajoutez vos animaux',
    text: 'Créez une fiche par animal avec sa photo, son espèce et sa date de naissance.',
  },
  ...(AI_EXTRACTION_ENABLED
    ? [
        {
          icon: 'camera' as IconName,
          title: 'Scannez vos documents',
          text: "Photographiez une ordonnance ou le carnet papier : l'IA pré-remplit l'événement, vous validez.",
        },
      ]
    : [
        {
          icon: 'document' as IconName,
          title: 'Tenez le carnet à jour',
          text: 'Ajoutez vaccins, traitements et visites en quelques secondes.',
        },
      ]),
  {
    icon: 'bell',
    title: 'Ne ratez plus un rappel',
    text: 'Recevez une notification avant chaque échéance de vaccin ou de traitement.',
  },
];

export default function HomeScreen() {
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
      className="flex-1 bg-surface"
      contentContainerClassName="flex-grow items-center justify-center gap-4 px-8 py-12">
      <Text className="text-display font-bold text-text">my-pets 🐾</Text>
      <Text className="text-callout text-text-secondary">carnet de santé numérique</Text>

      {showOnboarding ? (
        <Card className="mt-4 w-full">
          <Text className="text-headline font-bold text-text">Bienvenue !</Text>
          {ONBOARDING_STEPS.map((step) => (
            <View key={step.title} className="flex-row gap-3">
              <Icon name={step.icon} decorative />
              <View className="flex-1">
                <Text className="font-semibold text-text">{step.title}</Text>
                <Text className="text-callout text-text-secondary">{step.text}</Text>
              </View>
            </View>
          ))}
          <Link href="/animals/new" asChild>
            <Button label="Ajouter mon premier animal" onPress={dismissOnboarding} />
          </Link>
          <Button label="Plus tard" variant="ghost" onPress={dismissOnboarding} />
        </Card>
      ) : (
        <View className="mt-6 w-full">
          <Button label="Voir mes animaux" onPress={() => router.push('/animals')} />
        </View>
      )}
    </ScrollView>
  );
}
