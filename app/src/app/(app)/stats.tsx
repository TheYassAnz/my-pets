import { View, Text } from 'react-native';

import { Screen } from '@/components/ui';

export default function StatsScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Text className="text-body text-text">Graphiques et Santé</Text>
      </View>
    </Screen>
  );
}
