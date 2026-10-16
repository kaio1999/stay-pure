import { createMMKV, type MMKV } from 'react-native-mmkv';

class MemoryStore {
  private readonly map = new Map<string, string>();

  getString(key: string): string | undefined {
    return this.map.get(key);
  }

  set(key: string, value: string): void {
    this.map.set(key, value);
  }

  remove(key: string): boolean {
    return this.map.delete(key);
  }
}

function createStore(): MMKV | MemoryStore {
  try {
    return createMMKV({ id: 'stay-pure' });
  } catch {
    return new MemoryStore();
  }
}

export const appStorage = createStore();

export const storageKeys = {
  devotionPrefix: 'devotion:',
  journeyPrefix: 'journey:',
  onboarding: 'onboarding.done',
  reminder: 'settings.reminder',
  accountability: 'settings.accountability',
  shieldWanted: 'shield.wanted',
  shieldStrict: 'shield.strict',
} as const;
