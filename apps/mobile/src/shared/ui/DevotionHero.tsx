import { StyleSheet, Text, View } from 'react-native';
import type { Devotional } from '../../core/domain/entities/models';
import { colors, fonts, layout, radii, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';

interface Props {
  devotion: Devotional;
}

export function DevotionHero({ devotion }: Props) {
  const kicker = devotion.author ?? 'Devocional de hoje';
  return (
    <View style={styles.card}>
      <Text style={typography.kicker}>{kicker}</Text>
      {devotion.work ? <Text style={styles.work}>{devotion.work}</Text> : null}
      <Text style={styles.title}>{devotion.title}</Text>
      <Text style={styles.ref}>{devotion.scriptureRef}</Text>
      <Text style={styles.verse}>{devotion.scriptureText}</Text>
      <View style={styles.rule} />
      <Text style={typography.body}>{devotion.reflection}</Text>
      <Text style={styles.prayerLabel}>Oração</Text>
      <Text style={styles.prayer}>{devotion.prayer}</Text>
      {devotion.author ? (
        <Text style={styles.attribution}>Texto clássico em domínio público · tradução fiel</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: layout.heroMinHeight,
    backgroundColor: colors.navyLift,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  work: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.parchmentMuted,
  },
  title: {
    marginTop: 12,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.parchment,
  },
  ref: {
    marginTop: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.gold,
  },
  verse: {
    marginTop: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    lineHeight: 28,
    color: colors.goldSoft,
  },
  rule: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 16,
  },
  prayerLabel: {
    marginTop: 18,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  prayer: {
    marginTop: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    lineHeight: 26,
    color: colors.parchment,
  },
  attribution: {
    marginTop: 16,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.parchmentMuted,
  },
});
