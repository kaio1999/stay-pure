import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { container } from '../../../core/di/container';
import { syncMorningReminder } from '../../devotion/presentation/morningReminder';
import { GoldButton } from '../../../shared/ui/GoldButton';
import { Screen } from '../../../shared/ui/Screen';
import { colors, fonts } from '../../../shared/theme/tokens';
import { typography } from '../../../shared/theme/typography';

const PAGES = [
  {
    kicker: 'Stay Pure',
    title: 'Um caminho de santidade.',
    body: 'Devocionais diários sobre pureza, guarda dos olhos e um coração limpo diante do Senhor.',
  },
  {
    kicker: 'Escudo',
    title: 'O filtro trabalha em silêncio.',
    body: 'Por baixo dos panos, um VPN DNS local recusa os principais destinos de pornografia no aparelho.',
  },
  {
    kicker: 'Interrupção',
    title: 'Quando o bloqueio acontece.',
    body: 'Em vez da página, um versículo. A tentação encontra Escritura — não um erro de rede.',
  },
];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const page = PAGES[index];
  const last = index === PAGES.length - 1;

  const next = async () => {
    if (!last) {
      setIndex((value) => value + 1);
      return;
    }
    await container.settings.completeOnboarding();
    const reminder = await container.settings.getReminder();
    await syncMorningReminder(reminder);
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={typography.kicker}>{page.kicker}</Text>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.body}>{page.body}</Text>
      </View>
      <GoldButton label={last ? 'Começar' : 'Continuar'} onPress={() => void next()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.parchment,
  },
  body: {
    marginTop: 16,
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 28,
    color: colors.parchmentMuted,
  },
});
