import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, useFonts } from '@expo-google-fonts/dm-sans';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { container } from '../src/core/di/container';
import { MORNING_REMINDER_ID, syncMorningReminder } from '../src/features/devotion/presentation/morningReminder';
import { useBlockEvents } from '../src/features/interruption/presentation/useBlockEvents';
import { colors } from '../src/shared/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useBlockEvents();

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
    void SplashScreen.hideAsync();
    void container.settings.hasCompletedOnboarding().then((done) => {
      if (!done) {
        router.replace('/onboarding');
        return;
      }
      void container.settings.getReminder().then((reminder) => {
        void syncMorningReminder(reminder);
      });
    });
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.identifier === MORNING_REMINDER_ID) {
        router.replace('/');
      }
    });
    return () => sub.remove();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.ink },
            animation: 'fade',
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
