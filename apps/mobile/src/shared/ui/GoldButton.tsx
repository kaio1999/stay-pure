import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'ghost';
  disabled?: boolean;
}

export function GoldButton({ label, onPress, variant = 'gold', disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'gold' ? styles.gold : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.4,
    color: colors.ink,
  },
  ghostLabel: {
    color: colors.parchment,
  },
});
