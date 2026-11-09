import '@/global.css';

import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ToastProvider } from '@/components/ui';
import { AppFontSources } from '@/constants/fonts';
import { SessionProvider, useSession } from '@/lib/auth-context';
import { registerServiceWorker } from '@/lib/pwa';

function RootNavigator() {
  const { user, isLoading } = useSession();

  // Pas de flash d'UI tant que la session n'est pas restaurée
  if (isLoading) return null;

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
  const [fontsLoaded] = useFonts(AppFontSources);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  // Pas de texte dans la mauvaise police le temps du chargement.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <AnimatedSplashOverlay />
            <RootNavigator />
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
