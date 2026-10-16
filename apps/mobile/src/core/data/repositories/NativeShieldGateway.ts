import type { BlockEvent, ShieldStatus } from '../../domain/entities/models';
import type { ShieldGateway } from '../../domain/repositories/contracts';
import { StayPureBlocker } from '../../../shared/native/StayPureBlocker';
import { appStorage, storageKeys } from '../datasources/storage';

const EMPTY: ShieldStatus = {
  enabled: false,
  pausedForCar: false,
  strictMode: false,
  domainCount: 0,
  blockedToday: 0,
  blockedTotal: 0,
  blockedByDay: {},
};

function parseBlockedByDay(value: unknown): Record<string, number> {
  if (!value) {
    return {};
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, number>;
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') {
    return value as Record<string, number>;
  }
  return {};
}

export class NativeShieldGateway implements ShieldGateway {
  async enable(strictMode: boolean): Promise<void> {
    appStorage.set(storageKeys.shieldWanted, '1');
    appStorage.set(storageKeys.shieldStrict, strictMode ? '1' : '0');
    await StayPureBlocker.enable(strictMode);
    await StayPureBlocker.accountabilityEvent('shield_on');
  }

  async disable(): Promise<void> {
    appStorage.set(storageKeys.shieldWanted, '0');
    await StayPureBlocker.disable();
  }

  async status(): Promise<ShieldStatus> {
    try {
      const native = await StayPureBlocker.status();
      return {
        ...EMPTY,
        ...native,
        pausedForCar: Boolean((native as ShieldStatus).pausedForCar),
        blockedByDay: parseBlockedByDay((native as ShieldStatus & { blockedByDay?: unknown }).blockedByDay),
        strictMode: appStorage.getString(storageKeys.shieldStrict) === '1',
      };
    } catch {
      return {
        ...EMPTY,
        strictMode: appStorage.getString(storageKeys.shieldStrict) === '1',
      };
    }
  }

  subscribe(listener: (event: BlockEvent) => void): () => void {
    return StayPureBlocker.subscribe(listener);
  }
}
