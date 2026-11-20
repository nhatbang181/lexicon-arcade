import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { LexiconV3DB } from './db';
import {
  attemptRepo,
  bandRepo,
  cardRepo,
  essayRepo,
  eventRepo,
  planRepo,
  profileRepo,
  recordingRepo,
} from './repos';
import { createNewCard, scheduleCard } from '../srs/fsrsAdapter';
import { buildTodayPlan } from '../planner/today';
import { exportBackupJson, importBackup, verifyBackup } from './backup';

describe('src/core/storage — Dexie repos & backup/restore', () => {
  let testDb: LexiconV3DB;

  beforeEach(async () => {
    testDb = new LexiconV3DB(`LexiconTest_${Math.random().toString(36).slice(2)}`);
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  it('supports CRUD across profile, cards, reviews, attempts, essays, recordings, plans, bandSnapshots, and events', async () => {
    const profile = await profileRepo.getOrCreate(testDb);
    expect(profile.targetBands).toEqual({ L: 8.5, R: 8.5, W: 7.5, S: 7.5 });
    const updatedProfile = await profileRepo.update({ dailyGoalMin: 60 }, testDb);
    expect(updatedProfile.dailyGoalMin).toBe(60);

    // Cards & review transaction
    const now = new Date('2026-06-01T10:00:00Z');
    const card = createNewCard('vocab:mitigate', 'recog', { now });
    await cardRepo.upsert(card, testDb);
    expect(await cardRepo.toggleStar(card.id, testDb)).toBe(true);

    const scheduled = scheduleCard(card, Rating.Good, now);
    await cardRepo.recordReview(
      scheduled.card,
      {
        cardId: card.id,
        rating: Rating.Good,
        correct: true,
        hintUsed: false,
        durationMs: 3200,
        ts: now.getTime(),
        gameId: 'v1',
      },
      testDb,
    );
    expect((await cardRepo.getReviewsForCard(card.id, testDb)).length).toBe(1);
    expect((await cardRepo.getByItemId('vocab:mitigate', testDb)).length).toBe(1);

    // Atomic saveSession updates attempt, xp, streak, band snapshot
    const sessionRes = await attemptRepo.saveSession(
      {
        attempt: {
          gameId: 'l1',
          mode: 'exam',
          startedAt: now.getTime() - 600_000,
          endedAt: now.getTime(),
          score: 9,
          total: 10,
          xp: 120,
          items: [{ itemId: 'lep:p1_1:q1', correct: true }],
        },
        bandEvidence: [
          { skill: 'L', mode: 'exam', ts: now.getTime(), correct: 9, total: 10, sourceGameId: 'l1' },
        ],
      },
      testDb,
    );
    expect(sessionRes.totalXp).toBe(120);
    expect(sessionRes.streakCount).toBe(1);
    expect((await attemptRepo.getRecent({ gameId: 'l1' }, testDb)).length).toBe(1);
    expect((await bandRepo.getLatest('L', testDb))?.correct).toBe(9);

    // Essays
    const essayId = await essayRepo.save(
      {
        taskType: 'task2',
        promptId: 'w2:op_001',
        text: 'Education plays a vital role...',
        wordCount: 280,
        createdAt: now.getTime(),
        updatedAt: now.getTime(),
      },
      testDb,
    );
    await essayRepo.update(essayId, { officialBand: 7.5 }, testDb);
    expect((await essayRepo.get(essayId, testDb))?.officialBand).toBe(7.5);
    expect((await essayRepo.list({ taskType: 'task2' }, testDb)).length).toBe(1);

    // Recordings & pruning old audio blobs while preserving transcripts
    const oldTs = now.getTime() - 90 * 86_400_000;
    const recId = await recordingRepo.save(
      {
        part: 2,
        promptId: 's2c:001',
        durationSec: 110,
        transcript: 'I would like to talk about a quiet library.',
        audioBlob: new Blob(['audio-bytes'], { type: 'audio/webm' }),
        audioBytes: 50_000,
        createdAt: oldTs,
      },
      testDb,
    );
    expect(await recordingRepo.getTotalAudioBytes(testDb)).toBe(50_000);
    const pruned = await recordingRepo.pruneOldAudioBlobs(60, now.getTime(), testDb);
    expect(pruned.prunedCount).toBe(1);
    expect(pruned.freedBytes).toBe(50_000);
    const afterPrune = await recordingRepo.get(recId, testDb);
    expect(afterPrune?.audioBlob).toBeNull();
    expect(afterPrune?.transcript).toContain('quiet library');

    // Daily plans
    const plan = buildTodayPlan({ profile: updatedProfile, dueCardsCount: 12, now });
    await planRepo.save(plan, testDb);
    const marked = await planRepo.markTaskCompleted(plan.date, plan.tasks[0].id, testDb);
    expect(marked?.tasks[0].completed).toBe(true);

    // Events
    await eventRepo.log('session_complete', { gameId: 'l1' }, now.getTime(), testDb);
    expect((await eventRepo.listRecent({ type: 'session_complete' }, testDb)).length).toBe(1);
    expect(await eventRepo.pruneBefore(now.getTime() + 1000, testDb)).toBe(1);

    // Additional repo helpers: bulkUpsert, getDue, getSince, save/remove, list recordings, get plan, reset profile
    await cardRepo.bulkUpsert([createNewCard('vocab:extra1', 'recog', { now })], testDb);
    expect((await cardRepo.getDue(now.getTime() + 1000, testDb)).length).toBeGreaterThanOrEqual(1);
    await attemptRepo.save(
      {
        gameId: 'r1',
        mode: 'training',
        startedAt: now.getTime(),
        endedAt: now.getTime() + 1000,
        score: 5,
        total: 5,
        xp: 50,
        items: [],
      },
      testDb,
    );
    expect((await attemptRepo.getSince(now.getTime() - 1000, 'r1', testDb)).length).toBe(1);
    expect((await recordingRepo.list({ part: 2, promptId: 's2c:001' }, testDb)).length).toBe(1);
    expect((await planRepo.get(plan.date, testDb))?.date).toBe(plan.date);
    await essayRepo.remove(essayId, testDb);
    expect(await essayRepo.get(essayId, testDb)).toBeUndefined();
    const resetProf = await profileRepo.reset(testDb);
    expect(resetProf.xp).toBe(0);
  });

  it('exports checksummed JSON backup, rejects tampered backups, and restores cleanly into a fresh DB', async () => {
    await profileRepo.update({ xp: 450, dailyGoalMin: 60 }, testDb);
    await cardRepo.upsert(createNewCard('vocab:alleviate', 'recog'), testDb);
    await bandRepo.add({ skill: 'R', mode: 'exam', ts: Date.now(), correct: 35, total: 40 }, testDb);

    const json = await exportBackupJson(testDb);
    const verified = verifyBackup(json);
    expect(verified.valid).toBe(true);

    // Tamper with payload -> checksum mismatch
    const tampered = json.replace('450', '99999');
    const badCheck = verifyBackup(tampered);
    expect(badCheck.valid).toBe(false);
    expect(badCheck.error).toMatch(/checksum/i);

    // Malformed JSON
    expect(verifyBackup('{not-json').valid).toBe(false);

    // Restore into a brand-new database
    const restoredDb = new LexiconV3DB(`LexiconRestore_${Math.random().toString(36).slice(2)}`);
    await restoredDb.open();
    try {
      const result = await importBackup(json, restoredDb);
      expect(result.restoredCounts.profile).toBe(1);
      expect(result.restoredCounts.cards).toBe(1);
      expect(result.restoredCounts.bandSnapshots).toBe(1);

      const restoredProfile = await profileRepo.get(restoredDb);
      expect(restoredProfile?.xp).toBe(450);
      expect(restoredProfile?.dailyGoalMin).toBe(60);
      expect((await cardRepo.getAll(restoredDb))[0].itemId).toBe('vocab:alleviate');

      await expect(importBackup(tampered, restoredDb)).rejects.toThrow(/checksum/i);
    } finally {
      await restoredDb.delete();
    }
  });
});
