import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { container } from '../../../core/di/container';
import { accountabilityApiUrl, accountabilityToken } from '../../../core/config';
import type { AccountabilitySettings, ReminderSettings } from '../../../core/domain/entities/models';
import { StayPureBlocker } from '../../../shared/native/StayPureBlocker';
import { GoldButton } from '../../../shared/ui/GoldButton';
import { Screen } from '../../../shared/ui/Screen';
import { colors, fonts, radii, spacing } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';
import { syncMorningReminder } from '../../devotion/presentation/morningReminder';

const HOURS = [6, 7, 8, 9, 10];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function syncAccountability(next: AccountabilitySettings, shieldOn: boolean) {
  await StayPureBlocker.configureAccountability(
    next.enabled,
    next.email,
    next.deviceId,
    accountabilityApiUrl,
    accountabilityToken,
    shieldOn,
  );
}

export function SettingsScreen() {
  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: true, hour: 8 });
  const [account, setAccount] = useState<AccountabilitySettings>({
    enabled: false,
    email: '',
    deviceId: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void container.settings.getReminder().then(setReminder);
    void container.settings.getAccountability().then(setAccount);
  }, []);

  const persist = async (next: ReminderSettings) => {
    setReminder(next);
    await container.settings.saveReminder(next);
    const scheduled = await syncMorningReminder(next);
    if (next.enabled && !scheduled) {
      Alert.alert(
        'Lembrete',
        'Permita notificações para o Stay Pure avisar de manhã. Você pode mudar isso nas configurações do Android.',
      );
    }
  };

  const persistAccount = async (next: AccountabilitySettings) => {
    if (next.enabled && !EMAIL_RE.test(next.email.trim())) {
      Alert.alert('Prestar contas', 'Informe um e-mail válido da pessoa de confiança.');
      return;
    }
    if (next.enabled && !accountabilityApiUrl) {
      Alert.alert(
        'Prestar contas',
        'O aviso por e-mail precisa do serviço Stay Pure Watch no ar (SMTP). Sem isso, o contato é salvo aqui, mas a mensagem não sai.',
      );
    }
    setBusy(true);
    try {
      const shield = await container.shield.status();
      await container.settings.saveAccountability(next);
      setAccount(next);
      await syncAccountability(next, shield.enabled || shield.pausedForCar);
    } catch (error) {
      Alert.alert('Prestar contas', error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  };

  const toggleAccount = (enabled: boolean) => {
    if (enabled) {
      Alert.alert(
        'Confirmar prestar contas',
        'Essa pessoa receberá um e-mail se você desligar o escudo. Se o app for desinstalado ou ficar sem contato por algumas horas, ela também é avisada.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => void persistAccount({ ...account, enabled: true }) },
        ],
      );
      return;
    }
    void persistAccount({ ...account, enabled: false });
  };

  const sendTest = async () => {
    if (!account.enabled) {
      Alert.alert('Prestar contas', 'Ative o prestar contas antes de enviar o teste.');
      return;
    }
    setBusy(true);
    try {
      await StayPureBlocker.accountabilityEvent('test');
      Alert.alert('Prestar contas', 'Pedido de teste enviado. Peça para a pessoa olhar a caixa de entrada.');
    } catch (error) {
      Alert.alert('Prestar contas', error instanceof Error ? error.message : 'Falha ao enviar o teste.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={typography.kicker}>Ajustes</Text>
        <Text style={styles.title}>Lembrete da manhã</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.cardTitle}>Avisar todo dia</Text>
              <Text style={styles.cardBody}>
                Uma notificação para abrir o devocional. Sem isso, o hábito depende de lembrar sozinho.
              </Text>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={(enabled) => void persist({ ...reminder, enabled })}
              trackColor={{ false: colors.navyLift, true: colors.gold }}
              thumbColor={colors.parchment}
            />
          </View>
          {reminder.enabled ? (
            <View style={styles.hours}>
              {HOURS.map((hour) => {
                const active = reminder.hour === hour;
                return (
                  <Pressable
                    key={hour}
                    onPress={() => void persist({ ...reminder, hour })}
                    style={[styles.hourChip, active && styles.hourChipActive]}
                  >
                    <Text style={[styles.hourLabel, active && styles.hourLabelActive]}>
                      {`${String(hour).padStart(2, '0')}h`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, styles.later]}>Prestar contas</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.cardTitle}>Pessoa de confiança</Text>
              <Text style={styles.cardBody}>
                Ela recebe um e-mail se você desligar o escudo. Se desinstalar o app, o aviso pode
                levar algumas horas — celular desligado ou sem internet também dispara isso.
              </Text>
            </View>
            <Switch
              value={account.enabled}
              onValueChange={toggleAccount}
              trackColor={{ false: colors.navyLift, true: colors.gold }}
              thumbColor={colors.parchment}
              disabled={busy}
            />
          </View>
          <TextInput
            value={account.email}
            onChangeText={(email) => setAccount({ ...account, email })}
            onBlur={() => {
              if (account.enabled || account.email.trim()) {
                void persistAccount(account);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="email@exemplo.com"
            placeholderTextColor={colors.parchmentMuted}
            style={styles.input}
          />
          <View style={styles.accountActions}>
            <GoldButton
              label="Enviar e-mail de teste"
              variant="ghost"
              disabled={busy || !account.enabled}
              onPress={() => void sendTest()}
            />
          </View>
        </View>

        <Text style={[styles.title, styles.later]}>Sobre o Stay Pure</Text>
        <Text style={typography.body}>
          O devocional do dia vem de autores cristãos reais — Ryle, Owen, Agostinho, Spurgeon e
          outros — em obras de domínio público. Metade do calendário é sobre pureza e
          santidade; a outra metade é a leitura da manhã de Spurgeon.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Escudo</Text>
          <Text style={styles.cardBody}>
            O filtro liga-se na aba Escudo. Depois de um bloqueio, o site fica em silêncio por
            45 minutos para você não voltar à mesma guia.
          </Text>
        </View>
        <Text style={styles.version}>Stay Pure · 1.0.0</Text>
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
    marginBottom: 12,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.parchment,
  },
  later: {
    marginTop: 28,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.navyLift,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCopy: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.parchment,
  },
  cardBody: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.parchmentMuted,
  },
  input: {
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.navy,
    color: colors.parchment,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  accountActions: {
    marginTop: 16,
  },
  hours: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourChip: {
    minWidth: 56,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  hourChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  hourLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.parchment,
  },
  hourLabelActive: {
    color: colors.ink,
  },
  version: {
    marginTop: 28,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.parchmentMuted,
  },
});
