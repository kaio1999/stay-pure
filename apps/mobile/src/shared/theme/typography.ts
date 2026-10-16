import { StyleSheet } from 'react-native';
import { colors, fonts } from './tokens';

export const typography = StyleSheet.create({
  kicker: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.parchment,
  },
  verse: {
    fontFamily: fonts.bodyMedium,
    fontSize: 22,
    lineHeight: 32,
    color: colors.parchment,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.parchment,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 28,
    color: colors.parchmentMuted,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.parchmentMuted,
  },
});
