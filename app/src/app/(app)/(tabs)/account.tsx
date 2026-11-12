import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, ListRow, Text } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/lib/auth-context';
import { setThemePreference } from '@/lib/color-scheme';
import { confirmAction, notifyError } from '@/lib/dialog';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const scheme = useColorScheme();

  const confirmSignOut = async () => {
    if (!(await confirmAction('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', { confirmLabel: 'Se déconnecter' }))) return;
    try {
      await signOut();
    } catch {
      notifyError('Déconnexion impossible. Vérifiez votre connexion et réessayez.');
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
      contentContainerClassName="px-5 pb-36">
      <Text accessibilityRole="header" className="mb-1 mt-2 text-[32px] font-extrabold text-text">
        Compte
      </Text>
      <Text className="mb-4 text-[15px] text-text-secondary">{user?.email}</Text>
      <View>
        <ListRow
          title={scheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          leading={<Icon name={scheme === 'dark' ? 'sun' : 'moon'} decorative />}
          onPress={() => setThemePreference(scheme === 'dark' ? 'light' : 'dark')}
          className="border-b border-border"
        />
      </View>
      <View className="mt-6">
        <Button label="Se déconnecter" variant="destructive" onPress={confirmSignOut} />
      </View>
    </ScrollView>
  );
}
