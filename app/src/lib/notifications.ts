import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

// Notifications affichées même app au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

// Demande la permission, récupère le token Expo et l'enregistre auprès de
// l'API. Silencieux en cas d'échec : les rappels sont un plus, pas un bloquant
// (simulateur, permission refusée, projectId EAS absent en dev...).
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Rappels santé',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.granted
      ? existing
      : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await api.registerPushToken(token);
    registeredToken = token;
  } catch {
    // Jamais bloquant pour le reste de l'app
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  if (!registeredToken) return;
  try {
    await api.removePushToken(registeredToken);
  } catch {
    // La déconnexion locale doit réussir même si l'API est injoignable
  } finally {
    registeredToken = null;
  }
}
