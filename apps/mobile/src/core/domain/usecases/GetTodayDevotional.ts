import type { Devotional } from '../entities/models';
import type { DevotionalRepository } from '../repositories/contracts';

export interface InstantDevotionalSource {
  byDate(dateKey: string): Devotional;
}

export class GetTodayDevotional {
  constructor(
    private readonly cache: DevotionalRepository,
    private readonly fallback: InstantDevotionalSource,
  ) {}

  async execute(dateKey: string): Promise<{ current: Devotional; refresh: Promise<Devotional> }> {
    const cached = await this.cache.getByDate(dateKey);
    const usable = cached?.author ? cached : null;
    const current = usable ?? this.fallback.byDate(dateKey);
    if (!usable) {
      await this.cache.save(current);
    }
    return { current, refresh: Promise.resolve(current) };
  }
}
