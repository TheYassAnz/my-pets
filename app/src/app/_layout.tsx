import '@/global.css';

import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ErrorState, ToastProvider } from '@/components/ui';
import { AppFontSources } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/auth-context';
import { registerServiceWorker } from '@/lib/pwa';
import { hideSplash } from '@/lib/splash';

function RootNavigator() {
  const { user, isLoading, restoreFailed, retryRestore } = useSession();
  const scheme = useColorScheme();

  // Le splash HTML couvre l'écran jusqu'à ce que la session soit restaurée (ou en échec).
  useEffect(() => {
    if (!isLoading) hideSplash();
  }, [isLoading]);

  if (restoreFailed) {
    return <ErrorState message="Impossible de joindre le serveur. Réessayez dans un instant." onRetry={retryRestore} />;
  }

  // Invisible au premier chargement (le splash le recouvre), visible pendant un « Réessayer ».
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={Colors[scheme === 'dark' ? 'dark' : 'light'].textSecondary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts(AppFontSources);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  // Pas de texte dans la mauvaise police le temps du chargement (police système si l'échec persiste).
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* Colonne centrée de 480 px max sur grand écran (PWA) */}
          <View className="flex-1 items-center bg-surface-sunken">
            <View className="w-full max-w-[480px] flex-1 bg-surface">
              <ToastProvider>
                <AnimatedSplashOverlay />
                <RootNavigator />
              </ToastProvider>
            </View>
          </View>
        </ThemeProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
