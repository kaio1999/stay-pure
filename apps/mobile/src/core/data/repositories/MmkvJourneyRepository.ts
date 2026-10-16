import type { JourneyDay } from '../../domain/entities/models';
import type { JourneyRepository, ShieldGateway } from '../../domain/repositories/contracts';
import { todayKey } from '../../domain/usecases/dateKey';
import { appStorage, storageKeys } from '../datasources/storage';

interface JourneyRecord {
  dateKey: string;
  read?: boolean;
}

export class MmkvJourneyRepository implements JourneyRepository {
  constructor(private readonly shield: ShieldGateway) {}

  async markRead(dateKey: string): Promise<void> {
    const current = this.record(dateKey);
    appStorage.set(
      storageKeys.journeyPrefix + dateKey,
      JSON.stringify({ ...current, dateKey, read: true }),
    );
  }

  async incrementBlocked(_dateKey: string): Promise<void> {}

  async isRead(dateKey: string): Promise<boolean> {
    return this.readFlag(dateKey);
  }

  async getDay(dateKey: string): Promise<JourneyDay> {
    const status = await this.shield.status();
    return {
      dateKey,
      read: this.readFlag(dateKey),
      blockedCount: status.blockedByDay[dateKey] ?? 0,
    };
  }

  async list(limit: number): Promise<JourneyDay[]> {
    const status = await this.shield.status();
    const days: JourneyDay[] = [];
    const now = new Date();
    for (let i = 0; i < limit; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const key = todayKey(date);
      days.push({
        dateKey: key,
        read: this.readFlag(key),
        blockedCount: status.blockedByDay[key] ?? 0,
      });
    }
    return days;
  }

  async streak(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      if (!this.readFlag(todayKey(date))) {
        break;
      }
      count += 1;
    }
    return count;
  }

  private readFlag(dateKey: string): boolean {
    return Boolean(this.record(dateKey).read);
  }

  private record(dateKey: string): JourneyRecord {
    const raw = appStorage.getString(storageKeys.journeyPrefix + dateKey);
    if (!raw) {
      return { dateKey };
    }
    try {
      return JSON.parse(raw) as JourneyRecord;
    } catch {
      return { dateKey };
    }
  }
}
