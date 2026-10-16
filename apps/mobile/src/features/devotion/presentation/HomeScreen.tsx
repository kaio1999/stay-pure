import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DevotionHero } from '../../../shared/ui/DevotionHero';
import { GoldButton } from '../../../shared/ui/GoldButton';
import { Screen } from '../../../shared/ui/Screen';
import { StayPureBlocker } from '../../../shared/native/StayPureBlocker';
import { colors, fonts, radii, spacing } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';
import { useTodayDevotional } from './useTodayDevotional';
import { useJourney } from '../../journey/presentation/useJourney';
import { useShield } from '../../shield/presentation/useShield';

export function HomeScreen() {
  const { devotion, read, markRead } = useTodayDevotional();
  const { streak, refresh } = useJourney();
  const { status } = useShield();
  const [guardNotice, setGuardNotice] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (StayPureBlocker.consumeGuardNotice()) {
        setGuardNotice(true);
      }
    }, []),
  );

  const markToday = async () => {
    await markRead();
    refresh();
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={typography.kicker}>Stay Pure</Text>
        <Text style={styles.hello}>Guarde o coração.</Text>
        {guardNotice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>O escudo agiu</Text>
            <Text style={styles.noticeBody}>
              Este destino fica em silêncio por 45 minutos. O registro está na Jornada.
            </Text>
          </View>
        ) : null}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>dias na Palavra</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {status.pausedForCar ? 'Auto' : status.enabled ? 'On' : 'Off'}
            </Text>
            <Text style={styles.statLabel}>escudo</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{status.blockedToday}</Text>
            <Text style={styles.statLabel}>bloqueios hoje</Text>
          </View>
        </View>
        {devotion ? <DevotionHero devotion={devotion} /> : <View style={styles.placeholder} />}
        {devotion && !read ? (
          <View style={styles.readAction}>
            <GoldButton label="Marquei como lido" onPress={() => void markToday()} />
          </View>
        ) : null}
        {devotion && read ? (
          <Text style={styles.readDone}>Lido hoje. O streak conta este dia.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  hello: {
    marginTop: 10,
    marginBottom: 24,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.parchment,
  },
  notice: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.navyLift,
  },
  noticeTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.gold,
  },
  noticeBody: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.parchmentMuted,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.navyLift,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.gold,
  },
  statLabel: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.parchmentMuted,
  },
  placeholder: {
    minHeight: 312,
    borderRadius: radii.lg,
    backgroundColor: colors.navyLift,
  },
  readAction: {
    marginTop: 18,
  },
  readDone: {
    marginTop: 16,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.gold,
  },
});
