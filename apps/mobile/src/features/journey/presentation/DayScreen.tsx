import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { container } from '../../../core/di/container';
import type { Devotional, JourneyDay } from '../../../core/domain/entities/models';
import { formatDateKey, todayKey } from '../../../core/domain/usecases/dateKey';
import { GoldButton } from '../../../shared/ui/GoldButton';
import { DevotionHero } from '../../../shared/ui/DevotionHero';
import { Screen } from '../../../shared/ui/Screen';
import { colors, fonts } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';

export function DayScreen() {
  const { dateKey } = useLocalSearchParams<{ dateKey: string }>();
  const key = dateKey ?? todayKey();
  const [devotion, setDevotion] = useState<Devotional | null>(null);
  const [day, setDay] = useState<JourneyDay | null>(null);

  const load = useCallback(async () => {
    const result = await container.getTodayDevotional.execute(key);
    setDevotion(result.current);
    setDay(await container.journey.getDay(key));
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async () => {
    await container.markDevotionalRead.execute(key);
    setDay(await container.journey.getDay(key));
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={typography.kicker}>Jornada</Text>
        <Text style={styles.title}>{formatDateKey(key)}</Text>
        {day ? (
          <Text style={styles.meta}>
            {day.read ? 'Lido na Palavra.' : 'Ainda não marcado como lido.'}
            {day.blockedCount > 0
              ? ` O escudo agiu ${day.blockedCount} ${day.blockedCount === 1 ? 'vez' : 'vezes'}.`
              : ' O escudo não precisou agir neste dia.'}
          </Text>
        ) : null}
        {devotion ? <DevotionHero devotion={devotion} /> : <View style={styles.placeholder} />}
        {day && !day.read ? (
          <View style={styles.actions}>
            <GoldButton label="Marquei como lido" onPress={() => void markRead()} />
          </View>
        ) : null}
        <View style={styles.actions}>
          <GoldButton variant="ghost" label="Voltar" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  title: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.parchment,
    textTransform: 'capitalize',
  },
  meta: {
    marginBottom: 20,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.parchmentMuted,
  },
  placeholder: {
    minHeight: 280,
  },
  actions: {
    marginTop: 16,
  },
});
