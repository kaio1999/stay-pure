import { requireOptionalNativeModule } from 'expo';
import type { BlockEvent, ShieldStatus } from '../../core/domain/entities/models';

interface StayPureBlockerNative {
  enable(strictMode: boolean): Promise<void>;
  disable(): Promise<void>;
  status(): Promise<ShieldStatus>;
  hasOverlayPermission(): boolean;
  openOverlaySettings(): Promise<void>;
  openFullScreenSettings(): Promise<void>;
  leaveBrowser(host?: string | null, reopen?: boolean | null): Promise<void>;
  consumeGuardNotice(): boolean;
  configureAccountability(
    enabled: boolean,
    email: string,
    deviceId: string,
    apiUrl: string,
    token: string,
    shieldOn: boolean,
  ): Promise<void>;
  accountabilityEvent(kind: string): Promise<void>;
  addListener(event: 'onBlocked', listener: (event: BlockEvent) => void): { remove: () => void };
}

class FallbackBlocker {
  async enable(): Promise<void> {
    throw new Error('O escudo exige o APK nativo Stay Pure (não roda no Expo Go).');
  }

  async disable(): Promise<void> {}

  async status(): Promise<ShieldStatus> {
    return {
      enabled: false,
      pausedForCar: false,
      strictMode: false,
      domainCount: 0,
      blockedToday: 0,
      blockedTotal: 0,
      blockedByDay: {},
    };
  }

  hasOverlayPermission(): boolean {
    return false;
  }

  async openOverlaySettings(): Promise<void> {}

  async openFullScreenSettings(): Promise<void> {}

  async leaveBrowser(_host?: string, _reopen?: boolean): Promise<void> {}

  consumeGuardNotice(): boolean {
    return false;
  }

  async configureAccountability(): Promise<void> {}

  async accountabilityEvent(): Promise<void> {}

  subscribe(): () => void {
    return () => undefined;
  }
}

const native = requireOptionalNativeModule<StayPureBlockerNative>('StayPureBlocker');

export const StayPureBlocker = native
  ? {
      enable: (strictMode: boolean) => native.enable(strictMode),
      disable: () => native.disable(),
      status: () => native.status(),
      hasOverlayPermission: () => native.hasOverlayPermission(),
      openOverlaySettings: () => native.openOverlaySettings(),
      openFullScreenSettings: () => native.openFullScreenSettings(),
      leaveBrowser: (host?: string, reopen = true) => native.leaveBrowser(host ?? null, reopen),
      consumeGuardNotice: () => native.consumeGuardNotice(),
      configureAccountability: (
        enabled: boolean,
        email: string,
        deviceId: string,
        apiUrl: string,
        token: string,
        shieldOn: boolean,
      ) => native.configureAccountability(enabled, email, deviceId, apiUrl, token, shieldOn),
      accountabilityEvent: (kind: string) => native.accountabilityEvent(kind),
      subscribe: (listener: (event: BlockEvent) => void) => {
        const sub = native.addListener('onBlocked', listener);
        return () => sub.remove();
      },
    }
  : new FallbackBlocker();
