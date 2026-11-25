import { describe, expect, it } from 'vitest';
import {
  createFSRSScheduler,
  createNewCard,
  getCardRetrievability,
  makeCardId,
  previewCardRatings,
  Rating,
  scheduleCard,
  State,
  type SRSCard,
} from './fsrsAdapter';
import { autoRate, computeFacePercentiles } from './autoRate';
import {
  FACE_FAMILY,
  getCardMastery,
  getItemMastery,
  getItemMasteryScore,
  getUnlockableVocabFaces,
  isCardRetired,
} from './faces';
import {
  buildReviewQueue,
  computeAbsenceDays,
  computeEffectiveNewCardsLimit,
  isRecoveryRoundEligible,
} from './queue';

describe('src/core/srs', () => {
  describe('fsrsAdapter', () => {
    it('creates a new card, schedules across ratings, and respects maximum_interval <= 365', () => {
      const t0 = new Date('2026-01-01T00:00:00Z');
      const scheduler = createFSRSScheduler({ enable_fuzz: false });
      const card = createNewCard('vocab:curriculum', 'recog', { now: t0 });

      expect(card.id).toBe(makeCardId('vocab:curriculum', 'recog'));
      expect(card.state).toBe(State.New);
      expect(getCardRetrievability(card, t0, scheduler)).toBe(0);

      const preview = previewCardRatings(card, t0, scheduler);
      expect(preview[Rating.Again].due).toBeLessThanOrEqual(preview[Rating.Easy].due);

      let cur = card;
      let curDate = t0;
      for (let i = 0; i < 12; i++) {
        const res = scheduleCard(cur, Rating.Easy, curDate, scheduler);
        cur = res.card;
        expect(cur.scheduled_days).toBeLessThanOrEqual(365);
        curDate = new Date(cur.due + 60_000);
      }

      expect(cur.reps).toBe(12);
      expect(cur.streak).toBe(12);
      expect(getCardRetrievability(cur, curDate, scheduler)).toBeGreaterThan(0);

      const lapsed = scheduleCard(cur, Rating.Again, curDate, scheduler);
      expect(lapsed.card.streak).toBe(0);
      expect(lapsed.card.lastReviewCorrect).toBe(false);
    });
  });

  describe('autoRate', () => {
    it('rates wrong, revealed, or multi-attempt answers as Again', () => {
      expect(autoRate({ correct: false, face: 'recog', responseTimeMs: 1000 })).toBe(Rating.Again);
      expect(
        autoRate({ correct: true, face: 'recog', responseTimeMs: 1000, revealedAnswer: true }),
      ).toBe(Rating.Again);
      expect(
        autoRate({ correct: true, face: 'recog', responseTimeMs: 1000, attemptCount: 2 }),
      ).toBe(Rating.Again);
    });

    it('rates hints, minor typos, or slow (> p90) answers as Hard', () => {
      expect(
        autoRate({ correct: true, face: 'recog', responseTimeMs: 3000, hintsUsed: 1 }),
      ).toBe(Rating.Hard);
      expect(
        autoRate({ correct: true, face: 'listen_spell', responseTimeMs: 6000, isTypo: true }),
      ).toBe(Rating.Hard);
      expect(autoRate({ correct: true, face: 'recog', responseTimeMs: 9000 })).toBe(Rating.Hard);
    });

    it('rates fast (< p25) answers as Easy ONLY when cardStreak >= 2, otherwise Good', () => {
      expect(
        autoRate({ correct: true, face: 'recog', responseTimeMs: 1500, cardStreak: 1 }),
      ).toBe(Rating.Good);
      expect(
        autoRate({ correct: true, face: 'recog', responseTimeMs: 1500, cardStreak: 2 }),
      ).toBe(Rating.Easy);
      expect(
        autoRate({ correct: true, face: 'recall_meaning', responseTimeMs: 7000, cardStreak: 5 }),
      ).toBe(Rating.Good);
    });

    it('uses expectedTimeMs and computeFacePercentiles properly', () => {
      expect(
        autoRate({
          correct: true,
          responseTimeMs: 2000,
          expectedTimeMs: 10_000,
          cardStreak: 3,
        }),
      ).toBe(Rating.Easy);
      expect(
        autoRate({
          correct: true,
          responseTimeMs: 18_000,
          expectedTimeMs: 10_000,
        }),
      ).toBe(Rating.Hard);

      // Fewer than 10 samples -> falls back to default
      expect(computeFacePercentiles([1000, 2000], 'recog')).toEqual({ p25: 2500, p90: 8000 });
      // >= 10 samples -> empirical p25/p90
      const samples = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10_000];
      const pct = computeFacePercentiles(samples, 'recog');
      expect(pct.p25).toBeLessThan(pct.p90);
      expect(
        autoRate({ correct: true, responseTimeMs: 1200, cardStreak: 2, percentiles: pct }),
      ).toBe(Rating.Easy);
    });
  });

  describe('faces & mastery', () => {
    it('unlocks faces progressively by stability (recog >= 3 -> recall >= 10 -> listen >= 21 -> use)', () => {
      const base = createNewCard('vocab:mitigate', 'recog');
      expect(FACE_FAMILY.col_gap).toBe('collocation');

      expect(getUnlockableVocabFaces([])).toEqual(['recog']);
      expect(getUnlockableVocabFaces([{ ...base, stability: 2 }])).toEqual([]);

      const recogMature: SRSCard = { ...base, stability: 4, state: State.Review, reps: 3 };
      expect(getUnlockableVocabFaces([recogMature])).toEqual(['recall_meaning', 'recall_cloze']);

      const recallCard: SRSCard = {
        ...createNewCard('vocab:mitigate', 'recall_meaning'),
        stability: 12,
        state: State.Review,
        reps: 4,
      };
      const clozeCard: SRSCard = {
        ...createNewCard('vocab:mitigate', 'recall_cloze'),
        stability: 5,
        state: State.Review,
        reps: 2,
      };
      expect(getUnlockableVocabFaces([recogMature, recallCard, clozeCard])).toEqual([
        'listen_spell',
      ]);

      const listenCard: SRSCard = {
        ...createNewCard('vocab:mitigate', 'listen_spell'),
        stability: 25,
        state: State.Review,
        reps: 5,
      };
      expect(getUnlockableVocabFaces([recogMature, recallCard, clozeCard, listenCard])).toEqual([
        'use',
      ]);
    });

    it('computes card mastery, item mastery (hardest unlocked face), score, and retry retirement', () => {
      const newC = createNewCard('vocab:a', 'recog');
      expect(getCardMastery(newC)).toBe('new');
      expect(getCardMastery({ ...newC, reps: 1, state: State.Learning, stability: 0.5 })).toBe(
        'learning',
      );
      expect(getCardMastery({ ...newC, reps: 3, state: State.Review, stability: 10 })).toBe(
        'young',
      );
      expect(getCardMastery({ ...newC, reps: 6, state: State.Review, stability: 30 })).toBe(
        'mature',
      );
      expect(
        getCardMastery({
          ...newC,
          reps: 10,
          state: State.Review,
          stability: 100,
          lastReviewCorrect: true,
        }),
      ).toBe('mastered');

      const recogMastered: SRSCard = {
        ...newC,
        reps: 10,
        state: State.Review,
        stability: 100,
        lastReviewCorrect: true,
      };
      const recallLearning: SRSCard = {
        ...createNewCard('vocab:a', 'recall_meaning'),
        reps: 1,
        state: State.Learning,
        stability: 0.5,
      };
      // Item mastery comes from hardest unlocked face (recall_meaning -> learning)
      expect(getItemMastery([recogMastered, recallLearning])).toBe('learning');
      expect(getItemMastery([])).toBe('new');
      expect(getItemMasteryScore([recogMastered, recallLearning])).toBeGreaterThan(0);
      expect(getItemMasteryScore([])).toBe(0);

      expect(isCardRetired({ face: 'tfng_retry', reps: 3, lastReviewCorrect: true })).toBe(true);
      expect(isCardRetired({ face: 'tfng_retry', reps: 3, lastReviewCorrect: false })).toBe(false);
      expect(isCardRetired({ face: 'recog', reps: 10, lastReviewCorrect: true })).toBe(false);
    });
  });

  describe('queue', () => {
    it('prioritizes overdue -> leech -> new (1 new per 4 reviews), caps backlog, and avoids adjacent same itemId', () => {
      const now = new Date('2026-06-01T12:00:00Z');
      const past = now.getTime() - 5 * 86_400_000;
      const future = now.getTime() + 5 * 86_400_000;

      const makeReview = (itemId: string, face: SRSCard['face'], lapses: number, stability: number): SRSCard => ({
        ...createNewCard(itemId, face, { now: new Date(past) }),
        state: State.Review,
        reps: 4,
        lapses,
        stability,
        last_review: past - 86_400_000,
        due: past,
      });

      const cards: SRSCard[] = [
        // Two due faces of the SAME headword to test anti-clustering
        makeReview('vocab:alpha', 'recog', 0, 2),
        makeReview('vocab:alpha', 'recall_meaning', 0, 2),
        makeReview('vocab:beta', 'recog', 0, 5),
        makeReview('vocab:gamma', 'recog', 0, 4),
        // Leech card (lapses >= 4)
        makeReview('vocab:delta', 'recog', 5, 3),
        // Future card (should be excluded)
        { ...makeReview('vocab:future', 'recog', 0, 10), due: future },
        // Locked & intro & retired cards (should be excluded)
        { ...createNewCard('vocab:locked', 'recall_meaning'), unlocked: false },
        createNewCard('vocab:intro_only', 'intro'),
        { ...makeReview('tfng:1', 'tfng_retry', 0, 5), reps: 3, lastReviewCorrect: true },
        // New cards
        createNewCard('vocab:new1', 'recog', { now, starred: true }),
        createNewCard('vocab:new2', 'recog', { now }),
        createNewCard('vocab:new3', 'recog', { now }),
      ];

      const res = buildReviewQueue(cards, {
        now,
        newCardsLimit: 2,
        reviewsPerNew: 4,
      });

      expect(res.stats.overdueCount).toBe(4);
      expect(res.stats.leechCount).toBe(1);
      expect(res.stats.newCount).toBe(2);
      expect(res.stats.backlogWarning).toBe(false);

      // No adjacent duplicates of same itemId
      for (let i = 1; i < res.queue.length; i++) {
        expect(res.queue[i].card.itemId).not.toBe(res.queue[i - 1].card.itemId);
      }

      // First new card should be the starred one
      const firstNew = res.queue.find((q) => q.bucket === 'new');
      expect(firstNew?.card.itemId).toBe('vocab:new1');
    });

    it('caps backlog to 120 and sets backlogWarning when due > 200', () => {
      const now = new Date('2026-06-01T12:00:00Z');
      const past = now.getTime() - 2 * 86_400_000;
      const cards: SRSCard[] = Array.from({ length: 210 }, (_, idx) => ({
        ...createNewCard(`vocab:w${idx}`, 'recog', { now: new Date(past) }),
        state: State.Review,
        reps: 2,
        stability: 3,
        last_review: past - 86_400_000,
        due: past,
      }));

      const res = buildReviewQueue(cards, { now, newCardsLimit: 0 });
      expect(res.stats.backlogWarning).toBe(true);
      expect(res.stats.dueTotal).toBe(210);
      expect(res.queue.length).toBe(120);
    });

    it('FX-2 (PP-02 / PP-C4 / L-11): van tải thẻ mới giảm bậc khi nhớ 7 ngày < 80% và dừng (=0) khi due > 150', () => {
      // Bình thường: giữ nguyên 15
      expect(computeEffectiveNewCardsLimit({ baseLimit: 15, dueCount: 40, retention7d: 0.85 })).toEqual({
        effectiveLimit: 15,
        baseLimit: 15,
        throttled: false,
        reason: null,
        reasonVi: null,
      });

      // Nhớ 7 ngày 75% (< 80%) -> giảm 15 -> 10
      const step1 = computeEffectiveNewCardsLimit({ baseLimit: 15, dueCount: 40, retention7d: 0.75 });
      expect(step1.effectiveLimit).toBe(10);
      expect(step1.throttled).toBe(true);
      expect(step1.reason).toBe('low_retention');
      expect(step1.reasonVi).toContain('75%');

      // Nhớ 7 ngày 62% (< 70%) -> giảm 15 -> 5
      const step2 = computeEffectiveNewCardsLimit({ baseLimit: 15, dueCount: 40, retention7d: 0.62 });
      expect(step2.effectiveLimit).toBe(5);
      expect(step2.reason).toBe('low_retention');

      // Due > 150 -> tạm dừng thẻ mới (= 0)
      const paused = computeEffectiveNewCardsLimit({ baseLimit: 15, dueCount: 151, retention7d: 0.92 });
      expect(paused.effectiveLimit).toBe(0);
      expect(paused.throttled).toBe(true);
      expect(paused.reason).toBe('due_overload');
      expect(paused.reasonVi).toContain('tạm nghỉ thẻ mới');

      // Kiểm chứng trực tiếp trong buildReviewQueue: 155 thẻ đến hạn + 10 thẻ mới -> 0 thẻ mới
      const now = new Date('2026-06-01T12:00:00Z');
      const past = now.getTime() - 2 * 86_400_000;
      const dueCards: SRSCard[] = Array.from({ length: 155 }, (_, i) => ({
        ...createNewCard(`vocab:due_${i}`, 'recog', { now: new Date(past) }),
        state: State.Review,
        reps: 2,
        stability: 3,
        last_review: past - 86_400_000,
        due: past,
      }));
      const newCards: SRSCard[] = Array.from({ length: 10 }, (_, i) =>
        createNewCard(`vocab:new_${i}`, 'recog', { now }),
      );
      const q = buildReviewQueue([...dueCards, ...newCards], { now, newCardsLimit: 15 });
      expect(q.stats.effectiveNewCardsLimit).toBe(0);
      expect(q.stats.newCount).toBe(0);
      expect(q.stats.newCardsThrottleReason).toBe('due_overload');
      expect(q.stats.newCardsThrottleReasonVi).toBeTruthy();
    });

    it('FX-2 (PP-02): vòng phục hồi bật khi vắng >= 3 ngày (mốc 04:00) và due > 50, giới hạn <= 50 thẻ', () => {
      // 02:30 sáng ngày 2026-06-04 theo giờ máy vẫn tính là ngày học 2026-06-03 (mốc 04:00)
      const beforeRollover = new Date(2026, 5, 4, 2, 30, 0);
      expect(computeAbsenceDays('2026-06-01', beforeRollover)).toBe(2);
      const afterRollover = new Date(2026, 5, 4, 5, 0, 0);
      expect(computeAbsenceDays('2026-06-01', afterRollover)).toBe(3);

      expect(isRecoveryRoundEligible({ absenceDays: 2, dueCount: 80 })).toBe(false);
      expect(isRecoveryRoundEligible({ absenceDays: 3, dueCount: 50 })).toBe(false);
      expect(isRecoveryRoundEligible({ absenceDays: 3, dueCount: 51 })).toBe(true);

      const now = new Date('2026-06-04T10:00:00Z');
      const past = now.getTime() - 4 * 86_400_000;
      const cards: SRSCard[] = Array.from({ length: 80 }, (_, i) => ({
        ...createNewCard(`vocab:r_${i}`, 'recog', { now: new Date(past) }),
        state: State.Review,
        reps: 2,
        stability: 3,
        last_review: past - 86_400_000,
        due: past,
      }));
      const q = buildReviewQueue(cards, { now, absenceDays: 3, sessionLimit: 60 });
      expect(q.stats.recoveryMode).toBe(true);
      expect(q.stats.recoveryReasonVi).toBe('Vòng phục hồi · tối đa 50 thẻ');
      expect(q.queue.length).toBe(50);

      // Chế độ bận (sessionLimit = 10) vẫn tôn trọng giới hạn nhỏ hơn
      const busyQ = buildReviewQueue(cards, { now, absenceDays: 4, sessionLimit: 10 });
      expect(busyQ.stats.recoveryMode).toBe(true);
      expect(busyQ.queue.length).toBe(10);
    });

    it('FX-2 (L-5 / PP-05): thẻ mới gom theo khối chủ đề, không trộn ngẫu nhiên các chủ đề ở lần học đầu', () => {
      const now = new Date('2026-06-01T12:00:00Z');
      // Tạo xen kẽ 3 chủ đề theo thứ tự thời gian: env, edu, tech, env, edu, tech, env, edu, tech
      const topicMap: Record<string, string> = {};
      const topics = ['environment', 'education', 'technology'];
      const newCards: SRSCard[] = Array.from({ length: 9 }, (_, i) => {
        const id = `vocab:t_${i}`;
        topicMap[id] = topics[i % 3];
        return createNewCard(id, 'recog', { now: new Date(now.getTime() + i * 1000) });
      });

      const res = buildReviewQueue(newCards, {
        now,
        newCardsLimit: 15,
        getNewCardTopic: (c) => topicMap[c.itemId],
      });

      const seenOrder = res.queue.map((q) => topicMap[q.card.itemId]);
      // Đếm số lần chuyển chủ đề: 3 chủ đề thành 3 khối liên tục -> đúng 2 lần chuyển
      let transitions = 0;
      for (let i = 1; i < seenOrder.length; i++) {
        if (seenOrder[i] !== seenOrder[i - 1]) transitions += 1;
      }
      expect(transitions).toBe(2);
      expect(seenOrder.slice(0, 3)).toEqual(['environment', 'environment', 'environment']);
      expect(seenOrder.slice(3, 6)).toEqual(['education', 'education', 'education']);
      expect(seenOrder.slice(6, 9)).toEqual(['technology', 'technology', 'technology']);
    });
  });
});
