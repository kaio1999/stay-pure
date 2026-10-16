import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  padded?: boolean;
}

export function Screen({ children, padded = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.ink, colors.navy]} style={StyleSheet.absoluteFill} />
      <StatusBar style="light" />
      <View
        style={[
          styles.safe,
          {
            paddingTop: insets.top + 12,
            paddingLeft: Math.max(insets.left, padded ? layout.screenGutter : 0),
            paddingRight: Math.max(insets.right, padded ? layout.screenGutter : 0),
            paddingBottom: 12,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  safe: {
    flex: 1,
  },
});
