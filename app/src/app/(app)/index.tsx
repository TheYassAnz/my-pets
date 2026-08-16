import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  Badge,
  Button,
  Divider,
  ErrorState,
  Icon,
  ListRow,
  Metric,
  Section,
  Skeleton,
  type IconName,
} from '@/components/ui';
import { api, ApiError, type AnimalWithUpcoming, type UpcomingHealthEvent } from '@/lib/api';
import { AI_EXTRACTION_ENABLED } from '@/lib/features';
import { daysUntil, deadlineState } from '@/lib/health-events';

const UPCOMING_WINDOW_DAYS = 90;

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

export default function TodayScreen() {
  const [animals, setAnimals] = useState<AnimalWithUpcoming[] | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingHealthEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
    return Promise.all([api.listAnimals(), api.listUpcomingEvents(UPCOMING_WINDOW_DAYS)])
      .then(([animalsResult, upcomingResult]) => {
        setAnimals(animalsResult);
        setUpcoming(upcomingResult);
      })
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
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!animals || !upcoming) {
    return (
      <View className="flex-1 bg-surface p-4 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="row" count={3} />
      </View>
    );
  }

  if (animals.length === 0) {
    return (
      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-4 p-4">
        <Text className="text-display font-bold text-text">Aujourd&apos;hui</Text>

        <Section>
          <Text className="text-headline font-semibold text-text">Aucun animal suivi</Text>
          <Text className="text-body text-text-secondary">
            Ajoutez votre premier compagnon pour démarrer son carnet de santé.
          </Text>
        </Section>

        <View className="gap-4">
          {ONBOARDING_STEPS.map((step) => (
            <View key={step.title} className="flex-row gap-3">
              <Icon name={step.icon} decorative />
              <View className="flex-1">
                <Text className="text-headline font-semibold text-text">{step.title}</Text>
                <Text className="text-body text-text-secondary">{step.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button label="Ajouter un animal" onPress={() => router.push('/animals/new')} />
      </ScrollView>
    );
  }

  const [hero, ...rest] = upcoming;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="pb-8">
      <Text className="text-display font-bold text-text p-4">Aujourd&apos;hui</Text>

      <Section>
        {hero ? (
          <>
            <Text className="text-eyebrow font-semibold uppercase text-text-tertiary">
              Prochaine échéance
            </Text>
            <Metric
              days={daysUntil(hero.nextDueDate)}
              state={deadlineState(daysUntil(hero.nextDueDate))}
              label={`${hero.title} · ${hero.animalName}`}
            />
          </>
        ) : (
          <Text className="text-body text-text-secondary">
            Aucune échéance dans les {UPCOMING_WINDOW_DAYS} jours.
          </Text>
        )}
      </Section>

      {rest.length > 0 ? (
        <>
          <Divider />
          <Section>
            <Text className="text-eyebrow font-semibold uppercase text-text-tertiary">
              À venir ({UPCOMING_WINDOW_DAYS} jours)
            </Text>
            {rest.map((event, index) => (
              <View key={event.id}>
                <Link href={`/animals/${event.animalId}/events/${event.id}`} asChild>
                  <ListRow
                    title={event.title}
                    subtitle={event.animalName}
                    trailing={
                      <Badge
                        state={deadlineState(daysUntil(event.nextDueDate))}
                        label={`J-${daysUntil(event.nextDueDate)}`}
                      />
                    }
                  />
                </Link>
                {index < rest.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Section>
        </>
      ) : null}
    </ScrollView>
  );
}
