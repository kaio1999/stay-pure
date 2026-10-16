import type { Devotional } from '../../domain/entities/models';
import { dayOfYear, parseDateKey } from '../../domain/usecases/dateKey';
import { PURITY_CLASSICS } from './classicPurity';
import { SPURGEON_MORNINGS } from './classicSpurgeon';
import type { ClassicEntry } from './classicTypes';

export class CatalogDevotionalGenerator {
  byDate(dateKey: string): Devotional {
    const date = parseDateKey(dateKey);
    const entry = pickClassic(dayOfYear(date));
    return {
      id: `classic:v1:${dateKey}`,
      dateKey,
      title: entry.title,
      author: entry.author,
      work: entry.work,
      scriptureRef: entry.scriptureRef,
      scriptureText: entry.scriptureText,
      reflection: entry.reflection,
      prayer: entry.prayer,
      source: 'catalog',
    };
  }
}

function pickClassic(dayOfYearIndex: number): ClassicEntry {
  const slot = Math.floor((dayOfYearIndex - 1) / 2);
  if (dayOfYearIndex % 2 === 1) {
    return PURITY_CLASSICS[slot % PURITY_CLASSICS.length];
  }
  return SPURGEON_MORNINGS[slot % SPURGEON_MORNINGS.length];
}

export const catalogSize = PURITY_CLASSICS.length + SPURGEON_MORNINGS.length;
