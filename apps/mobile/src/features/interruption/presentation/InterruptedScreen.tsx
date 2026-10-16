import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { container } from '../../../core/di/container';
import { StayPureBlocker } from '../../../shared/native/StayPureBlocker';
import { GoldButton } from '../../../shared/ui/GoldButton';
import { Screen } from '../../../shared/ui/Screen';
import { colors, fonts } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';

const PRAYER =
  'Senhor, cria em mim um coração puro. Desvia os meus olhos da vaidade. Quero olhar para Ti.';

export function InterruptedScreen() {
  const params = useLocalSearchParams<{ host?: string; verseId?: string }>();
  const [prayed, setPrayed] = useState(false);
  const verse = useMemo(() => {
    const listed = container.verses.list();
    const match = listed.find((item) => item.id === params.verseId);
    return match ?? container.getInterruptionVerse.execute(params.host ?? 'unknown');
  }, [params.host, params.verseId]);

  const continueWalk = () => {
    if (!prayed) {
      setPrayed(true);
      return;
    }
    void StayPureBlocker.leaveBrowser(params.host, false);
    router.replace('/');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
        <Text style={typography.kicker}>Você foi guardado</Text>
        <Text style={styles.verse}>{verse.text}</Text>
        <Text style={styles.ref}>{verse.reference}</Text>
        <Text style={styles.invite}>{verse.invitation}</Text>
        {prayed ? (
          <>
            <Text style={styles.prayer}>{PRAYER}</Text>
            <Text style={styles.snooze}>Este destino fica em silêncio por 45 minutos.</Text>
          </>
        ) : null}
        <View style={styles.actions}>
          <GoldButton
            label={prayed ? 'Ir ao texto de hoje' : 'Orar agora'}
            onPress={continueWalk}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  verse: {
    marginTop: 28,
    fontFamily: fonts.bodyMedium,
    fontSize: 24,
    lineHeight: 34,
    color: colors.parchment,
  },
  ref: {
    marginTop: 18,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  invite: {
    marginTop: 22,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.parchmentMuted,
  },
  prayer: {
    marginTop: 22,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    lineHeight: 26,
    color: colors.parchment,
  },
  snooze: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.gold,
  },
  actions: {
    marginTop: 36,
  },
});
