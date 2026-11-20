import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import { LexiconV3DB } from './db';
import { LEGACY_KEYS, migrateLegacyStorage } from './migrateLegacy';
import { cardRepo, profileRepo } from './repos';

describe('migrateLegacyStorage — V1/V2 localStorage to Dexie FSRS migration', () => {
  let testDb: LexiconV3DB;

  beforeEach(async () => {
    testDb = new LexiconV3DB(`LexiconMigrate_${Math.random().toString(36).slice(2)}`);
    await testDb.open();
    localStorage.clear();
  });

  afterEach(async () => {
    await testDb.delete();
    localStorage.clear();
  });

  it('migrates SRS words, IOE mistakes, player XP/streak, mute setting, and NEVER deletes localStorage', async () => {
    const now = new Date('2026-11-20T09:00:00Z');

    const legacySrsFixture = {
      Curriculum: {
        box: 4,
        streak: 5,
        mistakes: 0,
        lastReviewed: now.getTime() - 2 * 86_400_000,
        nextReview: now.getTime() + 10 * 86_400_000,
        isNemesis: false,
      },
      'Rote Learning': {
        box: 1,
        streak: 0,
        mistakes: 3,
        lastReviewed: now.getTime() - 86_400_000,
        nextReview: now.getTime(),
        isNemesis: true,
      },
    };

    const legacyMistakeBankFixture = [
      {
        id: 'm1',
        word: 'Accommodation',
        meaning: 'chỗ ở',
        ipa: '/əˌkɒm.əˈdeɪ.ʃən/',
        pos: 'n.',
        roundType: 'audio',
        correctAnswer: 'accommodation',
        timestamp: now.getTime() - 5000,
        realmId: 'awl',
      },
      'Questionnaire',
    ];

    const legacyPlayerFixture = {
      name: 'Erudite Hero',
      heroClass: 'Scholar',
      level: 4,
      exp: 65,
      hp: 120,
      gold: 500,
      streak: 6,
      maxStreak: 12,
    };

    localStorage.setItem(LEGACY_KEYS.SRS, JSON.stringify(legacySrsFixture));
    localStorage.setItem(LEGACY_KEYS.IOE_MISTAKE_BANK, JSON.stringify(legacyMistakeBankFixture));
    localStorage.setItem(LEGACY_KEYS.PLAYER, JSON.stringify(legacyPlayerFixture));
    localStorage.setItem(LEGACY_KEYS.MUTED, 'true');
    localStorage.setItem(LEGACY_KEYS.SNAKE_HIGHSCORE, '9999');

    const res = await migrateLegacyStorage({ database: testDb, now });

    expect(res.skipped).toBe(false);
    expect(res.srsCardsMigrated).toBe(2);
    expect(res.mistakeCardsMigrated).toBe(2);
    expect(res.xpMigrated).toBe(365); // (4-1)*100 + 65
    expect(res.streakMigrated).toBe(6);
    expect(res.mutedMigrated).toBe(true);

    // Profile updated with legacyMigrated = true, XP, streak, muted audio
    const profile = await profileRepo.get(testDb);
    expect(profile?.legacyMigrated).toBe(true);
    expect(profile?.xp).toBe(365);
    expect(profile?.streak.count).toBe(6);
    expect(profile?.streak.longest).toBe(12);
    expect(profile?.sfxVolume).toBe(0);
    expect(profile?.musicVolume).toBe(0);

    // High-box SRS word migrated with Review state & unlocked recall_meaning
    const curriculumRecog = await cardRepo.get('vocab:curriculum#recog', testDb);
    const curriculumRecall = await cardRepo.get('vocab:curriculum#recall_meaning', testDb);
    expect(curriculumRecog?.state).toBe(State.Review);
    expect(curriculumRecog?.stability).toBeGreaterThanOrEqual(18);
    expect(curriculumRecall?.unlocked).toBe(true);

    // Nemesis word has higher difficulty & lapses preserved
    const roteCard = await cardRepo.get('vocab:rote_learning#recog', testDb);
    expect(roteCard?.lapses).toBe(3);
    expect(roteCard?.difficulty).toBeGreaterThanOrEqual(7);

    // Mistakes migrated as immediately due recall_meaning cards
    const accCard = await cardRepo.get('vocab:accommodation#recall_meaning', testDb);
    const qCard = await cardRepo.get('vocab:questionnaire#recall_meaning', testDb);
    expect(accCard?.due).toBeLessThanOrEqual(now.getTime());
    expect(accCard?.source).toBe('legacy_mistake');
    expect(qCard?.due).toBeLessThanOrEqual(now.getTime());

    // CRITICAL INVARIANT: Legacy localStorage keys MUST NOT be deleted or modified
    expect(localStorage.getItem(LEGACY_KEYS.SRS)).toBe(JSON.stringify(legacySrsFixture));
    expect(localStorage.getItem(LEGACY_KEYS.IOE_MISTAKE_BANK)).toBe(
      JSON.stringify(legacyMistakeBankFixture),
    );
    expect(localStorage.getItem(LEGACY_KEYS.PLAYER)).toBe(JSON.stringify(legacyPlayerFixture));
    expect(localStorage.getItem(LEGACY_KEYS.MUTED)).toBe('true');
    expect(localStorage.getItem(LEGACY_KEYS.SNAKE_HIGHSCORE)).toBe('9999');

    // Idempotency: second call is skipped cleanly
    const second = await migrateLegacyStorage({ database: testDb, now });
    expect(second.skipped).toBe(true);
    expect(second.srsCardsMigrated).toBe(0);
  });

  it('handles empty or corrupted localStorage gracefully without throwing', async () => {
    localStorage.setItem(LEGACY_KEYS.SRS, '{corrupt json');
    localStorage.setItem(LEGACY_KEYS.IOE_MISTAKES, 'not-an-array');

    const res = await migrateLegacyStorage({ database: testDb });
    expect(res.skipped).toBe(false);
    expect(res.srsCardsMigrated).toBe(0);
    expect(res.mistakeCardsMigrated).toBe(0);

    const profile = await profileRepo.get(testDb);
    expect(profile?.legacyMigrated).toBe(true);
  });
});
