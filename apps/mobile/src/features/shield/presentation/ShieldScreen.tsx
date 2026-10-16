import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { GoldButton } from '../../../shared/ui/GoldButton';
import { Screen } from '../../../shared/ui/Screen';
import { colors, fonts, radii, spacing } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';
import { useShield } from './useShield';

export function ShieldScreen() {
  const { status, busy, toggle, setStrict } = useShield();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={typography.kicker}>Escudo</Text>
      <Text style={styles.title}>
        {status.pausedForCar
          ? 'Escudo pausado no Android Auto'
          : status.enabled
            ? 'Você está sendo guardado'
            : 'Ative o escudo'}
      </Text>
      <Text style={typography.body}>
        O Stay Pure intercepta o DNS do aparelho e recusa os principais destinos de pornografia.
        Quando um acesso é bloqueado, um versículo sobre pureza ocupa a tela.
      </Text>

      {status.pausedForCar ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Android Auto</Text>
          <Text style={styles.noticeBody}>
            O filtro foi desligado para o carro conectar. Ele volta sozinho quando você desconectar.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.count}>{status.domainCount.toLocaleString('pt-BR')}</Text>
        <Text style={styles.countLabel}>domínios no filtro</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Bloqueios hoje</Text>
          <Text style={styles.rowValue}>{status.blockedToday}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total</Text>
          <Text style={styles.rowValue}>{status.blockedTotal}</Text>
        </View>
      </View>

      <GoldButton
        label={status.enabled || status.pausedForCar ? 'Desligar escudo' : 'Ligar escudo'}
        variant={status.enabled || status.pausedForCar ? 'ghost' : 'gold'}
        disabled={busy}
        onPress={() => void toggle(!(status.enabled || status.pausedForCar))}
      />

      <View style={styles.strict}>
        <View style={styles.strictCopy}>
          <Text style={styles.strictTitle}>Modo estrito</Text>
          <Text style={styles.strictBody}>
            Bloqueia também DNS-over-HTTPS usados para furar filtros.
          </Text>
        </View>
        <Switch
          value={status.strictMode}
          onValueChange={(value) => void setStrict(value)}
          trackColor={{ false: colors.navyLift, true: colors.gold }}
          thumbColor={colors.parchment}
        />
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 8,
    marginBottom: 12,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.parchment,
  },
  notice: {
    marginTop: spacing.md,
    padding: 18,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.navy,
  },
  noticeTitle: {
    fontFamily: fonts.bodyBold,
    color: colors.gold,
    fontSize: 15,
  },
  noticeBody: {
    marginTop: 8,
    fontFamily: fonts.body,
    color: colors.parchmentMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  panel: {
    marginVertical: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.navyLift,
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.gold,
  },
  countLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.parchmentMuted,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    fontFamily: fonts.body,
    color: colors.parchmentMuted,
  },
  rowValue: {
    fontFamily: fonts.bodyBold,
    color: colors.parchment,
  },
  strict: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strictCopy: {
    flex: 1,
  },
  strictTitle: {
    fontFamily: fonts.bodyBold,
    color: colors.parchment,
    fontSize: 15,
  },
  strictBody: {
    marginTop: 4,
    fontFamily: fonts.body,
    color: colors.parchmentMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
