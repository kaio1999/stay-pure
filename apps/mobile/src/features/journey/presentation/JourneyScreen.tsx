import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../shared/ui/Screen';
import { colors, fonts, radii } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';
import { todayKey } from '../../../core/domain/usecases/dateKey';
import { useJourney } from './useJourney';

export function JourneyScreen() {
  const { streak, days } = useJourney();
  const today = todayKey();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={typography.kicker}>Jornada</Text>
      <Text style={styles.title}>{streak} dias seguidos</Text>
      <Text style={typography.body}>
        Cada dia na Palavra constrói um caminho. Toque um dia para ler o texto e ver se o
        escudo agiu. Os bloqueios não são fracasso — são guarda.
      </Text>
      <View style={styles.grid}>
        {days.map((day) => (
          <Pressable
            key={day.dateKey}
            accessibilityRole="button"
            onPress={() => router.push(`/day/${day.dateKey}`)}
            style={[
              styles.cell,
              day.read && styles.cellRead,
              day.dateKey === today && styles.cellToday,
            ]}
          >
            <Text style={styles.cellDay}>{day.dateKey.slice(8)}</Text>
            {day.blockedCount > 0 ? <Text style={styles.cellBlock}>{day.blockedCount}</Text> : null}
          </Pressable>
        ))}
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  title: {
    marginTop: 8,
    marginBottom: 12,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.parchment,
  },
  grid: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navyLift,
  },
  cellRead: {
    borderColor: colors.gold,
  },
  cellToday: {
    backgroundColor: colors.navy,
  },
  cellDay: {
    fontFamily: fonts.bodyBold,
    color: colors.parchment,
  },
  cellBlock: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.gold,
  },
});
