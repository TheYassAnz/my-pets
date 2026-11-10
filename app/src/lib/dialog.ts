// L'API Alert de React Native est un no-op sur react-native-web : on passe par les dialogues du navigateur.

export async function confirmAction(title: string, message: string): Promise<boolean> {
  return window.confirm(`${title}\n${message}`);
}

export function notifyError(message: string): void {
  window.alert(message);
}
