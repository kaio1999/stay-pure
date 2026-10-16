import { CatalogDevotionalGenerator } from '../data/datasources/CatalogDevotionalGenerator';
import { InMemoryVerseRepository } from '../data/datasources/InMemoryVerseRepository';
import { MmkvDevotionalRepository } from '../data/repositories/MmkvDevotionalRepository';
import { MmkvJourneyRepository } from '../data/repositories/MmkvJourneyRepository';
import { NativeShieldGateway } from '../data/repositories/NativeShieldGateway';
import { SecureSettingsRepository } from '../data/repositories/SecureSettingsRepository';
import { GetInterruptionVerse } from '../domain/usecases/GetInterruptionVerse';
import { GetTodayDevotional } from '../domain/usecases/GetTodayDevotional';
import { MarkDevotionalRead } from '../domain/usecases/MarkDevotionalRead';
import { ToggleShield } from '../domain/usecases/ToggleShield';

const settings = new SecureSettingsRepository();
const catalog = new CatalogDevotionalGenerator();
const devotionCache = new MmkvDevotionalRepository();
const verses = new InMemoryVerseRepository();
const shield = new NativeShieldGateway();
const journey = new MmkvJourneyRepository(shield);

export const container = {
  settings,
  journey,
  verses,
  shield,
  getTodayDevotional: new GetTodayDevotional(devotionCache, catalog),
  markDevotionalRead: new MarkDevotionalRead(journey),
  getInterruptionVerse: new GetInterruptionVerse(verses),
  toggleShield: new ToggleShield(shield),
} as const;

export type AppContainer = typeof container;
