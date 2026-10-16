import type { PurityVerse } from '../entities/models';
import type { VerseRepository } from '../repositories/contracts';

export class GetInterruptionVerse {
  constructor(private readonly verses: VerseRepository) {}

  execute(host: string, at = Date.now()): PurityVerse {
    const seed = hash(host) ^ at;
    return this.verses.pickInterruptionVerse(seed);
  }
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}
