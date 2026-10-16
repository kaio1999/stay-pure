import type { AccountabilitySettings, BlockEvent, Devotional, JourneyDay, PurityVerse, ReminderSettings, ShieldStatus } from '../entities/models';

export interface DevotionalRepository {
  getByDate(dateKey: string): Promise<Devotional | null>;
  save(devotional: Devotional): Promise<void>;
}

export interface VerseRepository {
  pickInterruptionVerse(seed: number): PurityVerse;
  list(): readonly PurityVerse[];
}

export interface ShieldGateway {
  enable(strictMode: boolean): Promise<void>;
  disable(): Promise<void>;
  status(): Promise<ShieldStatus>;
  subscribe(listener: (event: BlockEvent) => void): () => void;
}

export interface JourneyRepository {
  markRead(dateKey: string): Promise<void>;
  incrementBlocked(dateKey: string): Promise<void>;
  isRead(dateKey: string): Promise<boolean>;
  getDay(dateKey: string): Promise<JourneyDay>;
  list(limit: number): Promise<JourneyDay[]>;
  streak(): Promise<number>;
}

export interface SettingsRepository {
  hasCompletedOnboarding(): Promise<boolean>;
  completeOnboarding(): Promise<void>;
  getReminder(): Promise<ReminderSettings>;
  saveReminder(settings: ReminderSettings): Promise<void>;
  getAccountability(): Promise<AccountabilitySettings>;
  saveAccountability(settings: AccountabilitySettings): Promise<void>;
}
