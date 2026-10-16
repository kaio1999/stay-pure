import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { container } from '../../../core/di/container';
import type { ShieldStatus } from '../../../core/domain/entities/models';
import { StayPureBlocker } from '../../../shared/native/StayPureBlocker';

const INITIAL: ShieldStatus = {
  enabled: false,
  pausedForCar: false,
  strictMode: false,
  domainCount: 0,
  blockedToday: 0,
  blockedTotal: 0,
  blockedByDay: {},
};

async function ensureAlertPermissions() {
  await Notifications.requestPermissionsAsync();
  if (Platform.OS !== 'android') {
    return;
  }
  if (!StayPureBlocker.hasOverlayPermission()) {
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Tela do versículo',
        'Para o versículo aparecer na hora do bloqueio, permita “exibir sobre outros apps”. Sem isso o Android só silencia o site.',
        [
          { text: 'Agora não', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Permitir',
            onPress: () => {
              void StayPureBlocker.openOverlaySettings().finally(() => resolve());
            },
          },
        ],
      );
    });
  }
}

export function useShield() {
  const [status, setStatus] = useState<ShieldStatus>(INITIAL);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await container.shield.status());
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const toggle = useCallback(async (enabled: boolean) => {
    setBusy(true);
    try {
      if (enabled) {
        await ensureAlertPermissions();
      }
      const next = await container.toggleShield.execute(enabled, status.strictMode);
      setStatus(next);
      setTimeout(() => void refresh(), 800);
      if (enabled) {
        setTimeout(() => void refresh(), 2800);
      }
    } catch (error) {
      Alert.alert('Escudo', error instanceof Error ? error.message : 'Não foi possível alterar o escudo.');
    } finally {
      setBusy(false);
    }
  }, [status.strictMode, refresh]);

  const setStrict = useCallback(async (strictMode: boolean) => {
    setBusy(true);
    try {
      const next = await container.toggleShield.execute(status.enabled || status.pausedForCar, strictMode);
      setStatus(next);
    } catch (error) {
      Alert.alert('Modo estrito', error instanceof Error ? error.message : 'Falha ao atualizar.');
    } finally {
      setBusy(false);
    }
  }, [status.enabled, status.pausedForCar]);

  return { status, busy, toggle, setStrict, refresh };
}
