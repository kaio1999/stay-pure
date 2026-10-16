import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout } from '../../src/shared/theme/tokens';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navy,
          borderTopColor: colors.line,
          height: layout.tabBarHeight + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: 'rgba(244, 237, 225, 0.55)',
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shield"
        options={{
          title: 'Escudo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Jornada',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
