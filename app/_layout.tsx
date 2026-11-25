import { useEffect } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { benchlessColors } from '../src/design/tokens';
import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return <AuthProvider><RootNavigator /></AuthProvider>;
}

function RootNavigator() {
  const isDark = useColorScheme() === 'dark';
  const { status } = useAuth();
  const backgroundColor = isDark ? benchlessColors.dark.background : benchlessColors.light.background;

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel="Restoring your account" color={isDark ? benchlessColors.dark.accentStrong : benchlessColors.light.accentStrong} />
    </View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </View>
  );
}
