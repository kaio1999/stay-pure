export type ContentSource = 'cache' | 'catalog';

export interface Devotional {
  readonly id: string;
  readonly dateKey: string;
  readonly title: string;
  readonly author?: string;
  readonly work?: string;
  readonly scriptureRef: string;
  readonly scriptureText: string;
  readonly reflection: string;
  readonly prayer: string;
  readonly source: ContentSource;
}

export interface PurityVerse {
  readonly id: string;
  readonly reference: string;
  readonly text: string;
  readonly invitation: string;
}

export interface ShieldStatus {
  readonly enabled: boolean;
  readonly pausedForCar: boolean;
  readonly strictMode: boolean;
  readonly domainCount: number;
  readonly blockedToday: number;
  readonly blockedTotal: number;
  readonly blockedByDay: Readonly<Record<string, number>>;
}

export interface BlockEvent {
  readonly host: string;
  readonly blockedAt: number;
  readonly verseId: string;
}

export interface JourneyDay {
  readonly dateKey: string;
  readonly read: boolean;
  readonly blockedCount: number;
}

export interface ReminderSettings {
  readonly enabled: boolean;
  readonly hour: number;
}

export interface AccountabilitySettings {
  readonly enabled: boolean;
  readonly email: string;
  readonly deviceId: string;
}
