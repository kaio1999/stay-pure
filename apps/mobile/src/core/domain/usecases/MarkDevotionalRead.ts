import type { JourneyRepository } from '../repositories/contracts';

export class MarkDevotionalRead {
  constructor(private readonly journey: JourneyRepository) {}

  execute(dateKey: string): Promise<void> {
    return this.journey.markRead(dateKey);
  }
}
