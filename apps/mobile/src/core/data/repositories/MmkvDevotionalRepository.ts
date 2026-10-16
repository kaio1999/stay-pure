import type { Devotional } from '../../domain/entities/models';
import type { DevotionalRepository } from '../../domain/repositories/contracts';
import { appStorage, storageKeys } from '../datasources/storage';

export class MmkvDevotionalRepository implements DevotionalRepository {
  async getByDate(dateKey: string): Promise<Devotional | null> {
    const raw = appStorage.getString(storageKeys.devotionPrefix + dateKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Devotional;
    } catch {
      return null;
    }
  }

  async save(devotional: Devotional): Promise<void> {
    appStorage.set(storageKeys.devotionPrefix + devotional.dateKey, JSON.stringify(devotional));
  }
}
