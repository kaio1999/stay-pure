import type { AccountabilitySettings, ReminderSettings } from '../../domain/entities/models';
import type { SettingsRepository } from '../../domain/repositories/contracts';
import { appStorage, storageKeys } from '../datasources/storage';
import { secureGet, secureSet } from '../datasources/secureStorage';

const DEFAULT_REMINDER: ReminderSettings = { enabled: true, hour: 8 };

export class SecureSettingsRepository implements SettingsRepository {
  async hasCompletedOnboarding(): Promise<boolean> {
    return appStorage.getString(storageKeys.onboarding) === '1';
  }

  async completeOnboarding(): Promise<void> {
    appStorage.set(storageKeys.onboarding, '1');
  }

  async getReminder(): Promise<ReminderSettings> {
    const raw = appStorage.getString(storageKeys.reminder);
    if (!raw) {
      return DEFAULT_REMINDER;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
      const hour = Number(parsed.hour);
      return {
        enabled: parsed.enabled !== false,
        hour: Number.isFinite(hour) && hour >= 5 && hour <= 11 ? hour : DEFAULT_REMINDER.hour,
      };
    } catch {
      return DEFAULT_REMINDER;
    }
  }

  async saveReminder(settings: ReminderSettings): Promise<void> {
    appStorage.set(storageKeys.reminder, JSON.stringify(settings));
  }

  async getAccountability(): Promise<AccountabilitySettings> {
    const fromSecure = await secureGet(storageKeys.accountability);
    if (fromSecure) {
      return normalizeAccountability(fromSecure, async (next) => {
        await secureSet(storageKeys.accountability, JSON.stringify(next));
      });
    }

    const legacy = appStorage.getString(storageKeys.accountability);
    if (legacy) {
      const settings = await normalizeAccountability(legacy, async () => undefined);
      await secureSet(storageKeys.accountability, JSON.stringify(settings));
      appStorage.remove(storageKeys.accountability);
      return settings;
    }

    const created = { enabled: false, email: '', deviceId: newDeviceId() };
    await secureSet(storageKeys.accountability, JSON.stringify(created));
    return created;
  }

  async saveAccountability(settings: AccountabilitySettings): Promise<void> {
    await secureSet(storageKeys.accountability, JSON.stringify(settings));
    appStorage.remove(storageKeys.accountability);
  }
}

async function normalizeAccountability(
  raw: string,
  persist: (next: AccountabilitySettings) => Promise<void>,
): Promise<AccountabilitySettings> {
  try {
    const parsed = JSON.parse(raw) as Partial<AccountabilitySettings>;
    const next = {
      enabled: parsed.enabled === true,
      email: typeof parsed.email === 'string' ? parsed.email : '',
      deviceId: parsed.deviceId && parsed.deviceId.length > 8 ? parsed.deviceId : newDeviceId(),
    };
    if (next.deviceId !== parsed.deviceId) {
      await persist(next);
    }
    return next;
  } catch {
    const created = { enabled: false, email: '', deviceId: newDeviceId() };
    await persist(created);
    return created;
  }
}

function newDeviceId(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
