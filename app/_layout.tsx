import { Stack } from 'expo-router';
import { benchlessColors } from '../src/design/tokens';
import { useColorScheme, View } from 'react-native';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? benchlessColors.dark.background : benchlessColors.light.background }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
