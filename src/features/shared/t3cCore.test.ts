import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LexiconV3DB } from '../../core/storage/db';
import { attemptRepo } from '../../core/storage/repos/attemptRepo';
import { cardRepo } from '../../core/storage/repos/cardRepo';
import { createDefaultProfile, normalizeSfxVolume, profileRepo } from '../../core/storage/repos/profileRepo';
import {
  clearAllUserData,
  exportBackupJson,
  importBackup,
  isQuotaExceededError,
  shouldRemindBackup,
  verifyBackup,
} from '../../core/storage/backup';
import {
  buildBusyDayPlan,
  buildTodayPlan,
  computeFourStrands,
  createKeepStreakTask,
  type PlannerProfileInput,
} from '../../core/planner/today';
import { createNewCard } from '../../core/srs/fsrsAdapter';
import { GAME_REGISTRY } from '../../games/registry';

describe('T3-C C1 core: gamification outcomes, backup merge, planner Four Strands & PP-10', () => {
  let testDb: LexiconV3DB;

  beforeEach(async () => {
    testDb = new LexiconV3DB(`LexiconT3C_${Math.random().toString(36).slice(2)}`);
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('returns newBadges, levelUp, streakEvent and stores turnKind in attemptRepo.saveSession (F7, F8, PP-02)', async () => {
    const now = new Date('2026-06-10T10:00:00Z').getTime();
    const res = await attemptRepo.saveSession(
      {
        attempt: {
          gameId: 'v1',
          mode: 'training',
          startedAt: now - 300_000,
          endedAt: now,
          score: 10,
          total: 10,
          xp: 120,
          items: [{ itemId: 'vocab:test', correct: true }],
        },
      },
      testDb,
    );

    expect(res.levelUp).toEqual({ from: 1, to: 2 });
    expect(res.newBadges.some((b) => b.id === 'first_step')).toBe(true);
    expect(res.streakEvent.kind).toBe('started');

    const turnStats = await attemptRepo.getTurnKindSummary(0, testDb);
    expect(turnStats.retrieval).toBeGreaterThanOrEqual(10);
    expect(turnStats.activeRatio).toBe(1);
  });

  it('normalizes sfxVolume to 0..100 scale and defaults profile sfxVolume to 60', () => {
    expect(createDefaultProfile().sfxVolume).toBe(60);
    expect(normalizeSfxVolume(0.7)).toBe(70);
    expect(normalizeSfxVolume(85)).toBe(85);
    expect(normalizeSfxVolume(150)).toBe(100);
  });

  it('merges backup without losing local cards, attempts, or recordings (PB-05, X12)', async () => {
    const now = new Date('2026-06-10T10:00:00Z');
    await profileRepo.update({ xp: 300 }, testDb);
    await cardRepo.upsert(createNewCard('vocab:alpha', 'recog', { now }), testDb);
    await testDb.userItems.put({
      id: 'err:u1',
      kind: 'error',
      front: 'He go to school',
      back: 'He goes to school',
      noteVi: 'Chia động từ ngôi 3 số ít',
      source: 'essay_feedback',
      createdAt: now.getTime(),
    });
    const backupJson = await exportBackupJson(testDb, now);

    // Create target DB with different local progress + local recording
    const targetDb = new LexiconV3DB(`LexiconMerge_${Math.random().toString(36).slice(2)}`);
    await targetDb.open();
    try {
      await profileRepo.update({ xp: 500 }, targetDb);
      await cardRepo.upsert(createNewCard('vocab:beta', 'recog', { now }), targetDb);
      await targetDb.recordings.add({
        part: 2,
        promptId: 's2:local',
        durationSec: 60,
        transcript: 'Local recording kept',
        audioBlob: new Blob(['abc'], { type: 'audio/webm' }),
        audioBytes: 3,
        createdAt: now.getTime(),
      });

      const merged = await importBackup(backupJson, targetDb, { mode: 'merge' });
      expect(merged.mode).toBe('merge');
      expect((await cardRepo.getAll(targetDb)).length).toBe(2);
      expect((await targetDb.userItems.toArray()).length).toBe(1);
      expect((await profileRepo.get(targetDb))?.xp).toBe(500);
      expect((await targetDb.recordings.toArray())[0].transcript).toBe('Local recording kept');

      // Rejects invalid structure via zod.safeParse (SR-34)
      expect(verifyBackup({ schemaVersion: 2, data: {} }).valid).toBe(false);

      // Backup reminder triggers after > 7 days
      const reminder = await shouldRemindBackup(
        new Date(now.getTime() + 8 * 86_400_000),
        testDb,
      );
      expect(reminder.due).toBe(true);
      expect(reminder.daysSince).toBe(8);

      // Clear user data while keeping recordings (PB-12)
      await clearAllUserData({ keepRecordings: true }, targetDb);
      expect((await cardRepo.getAll(targetDb)).length).toBe(0);
      expect((await targetDb.recordings.toArray()).length).toBe(1);
    } finally {
      await targetDb.delete();
    }
  });

  it('detects QuotaExceededError cleanly (PB-17)', () => {
    expect(isQuotaExceededError({ name: 'QuotaExceededError' })).toBe(true);
    expect(isQuotaExceededError({ code: 22 })).toBe(true);
    expect(isQuotaExceededError(new Error('network'))).toBe(false);
  });

  it('computes Four Strands balance, boosts < 15% strand, enforces PP-10 output, and builds busy/keep-streak plans', () => {
    const now = new Date('2026-06-10T10:00:00Z');
    const recent = [
      { gameId: 'v1' as const, startedAt: now.getTime() - 2 * 86_400_000, endedAt: now.getTime() - 2 * 86_400_000 + 25 * 60_000 },
      { gameId: 'v2' as const, startedAt: now.getTime() - 86_400_000, endedAt: now.getTime() - 86_400_000 + 20 * 60_000 },
    ];
    const strands = computeFourStrands(recent, now, 7);
    expect(strands.totalMinutes).toBe(45);
    expect(strands.strands.language.pct).toBe(100);
    expect(strands.underrepresented).toContain('input');
    expect(strands.underrepresented).toContain('output');

    const profile: PlannerProfileInput = {
      targetBands: { L: 8.5, R: 8.5, W: 7.5, S: 7.5 },
      estimatedBands: { L: 6.5, R: 7.0, W: 7.0, S: 7.0 },
      dailyGoalMin: 30,
    };
    const plan = buildTodayPlan({ profile, dueCardsCount: 10, now, recentAttempts: recent });
    // PP-10: >= 20 min day always has >= 1 production task (w1/w2/s1/s2)
    expect(plan.tasks.some((t) => ['w1', 'w2', 's1', 's2'].includes(t.gameId))).toBe(true);

    const busy = buildBusyDayPlan({ profile, dueCardsCount: 12, now });
    expect(busy.goalMinutes).toBe(10);
    expect(busy.totalMinutes).toBeLessThanOrEqual(10);

    const keep = createKeepStreakTask(now);
    expect(keep.estMinutes).toBe(5);
    expect(keep.mode).toBe('sprint');
  });

  it('does not expose FSRS jargon in GAME_REGISTRY subtitleVi (D7)', () => {
    for (const g of GAME_REGISTRY) {
      expect(g.subtitleVi).not.toMatch(/\bFSRS\b/);
    }
  });
});
