import { createInitialStreak } from '../../gamification/streak';
import { db as defaultDb, type LexiconV3DB, type UserProfile } from '../db';
import type { GameId } from '../../planner/today';

export function createDefaultProfile(now = Date.now()): UserProfile {
  const defaultLevels: Record<GameId, number> = {
    v1: 1,
    v2: 1,
    v3: 1,
    l1: 1,
    l2: 1,
    r1: 1,
    r2: 1,
    w1: 1,
    w2: 1,
    s1: 1,
    s2: 1,
    x1: 1,
  };

  return {
    id: 'me',
    createdAt: now,
    // Default Profile A (docs/01 §1, docs/02 §6)
    targetBands: { L: 8.5, R: 8.5, W: 7.5, S: 7.5 },
    estimatedBands: {
      L: null,
      R: null,
      W: null,
      S: null,
      overall: null,
      confidence: { L: null, R: null, W: null, S: null },
    },
    skillLevels: defaultLevels,
    dailyGoalMin: 45,
    newCardsPerDay: 15,
    streak: createInitialStreak(),
    xp: 0,
    badges: [],
    placementDoneAt: null,
    examDate: null,
    theme: 'system',
    sfxVolume: 60,
    musicVolume: 25,
    legacyMigrated: false,
    writingBiasOffset: 0,
  };
}

/** Chuẩn hoá âm lượng SFX về thang 0..100 (tương thích hồ sơ cũ lưu 0..1). */
export function normalizeSfxVolume(value: number | undefined | null): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 60;
  if (value > 0 && value <= 1) return Math.round(value * 100);
  return Math.max(0, Math.min(100, Math.round(value)));
}

export const profileRepo = {
  async get(database: LexiconV3DB = defaultDb): Promise<UserProfile | undefined> {
    return database.profile.get('me');
  },

  async getOrCreate(database: LexiconV3DB = defaultDb): Promise<UserProfile> {
    const existing = await database.profile.get('me');
    if (existing) return existing;
    const created = createDefaultProfile();
    await database.profile.put(created);
    return created;
  },

  async update(
    patch: Partial<Omit<UserProfile, 'id'>>,
    database: LexiconV3DB = defaultDb,
  ): Promise<UserProfile> {
    const current = await profileRepo.getOrCreate(database);
    const updated: UserProfile = {
      ...current,
      ...patch,
      id: 'me',
    };
    await database.profile.put(updated);
    return updated;
  },

  async reset(database: LexiconV3DB = defaultDb): Promise<UserProfile> {
    const fresh = createDefaultProfile();
    await database.profile.put(fresh);
    return fresh;
  },
};
