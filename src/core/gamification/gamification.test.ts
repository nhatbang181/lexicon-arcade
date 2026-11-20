import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { calculateTurnXp, isRareMasteredCard, xpToLevel } from './xp';
import {
  checkStreakStatus,
  createInitialStreak,
  qualifiesForStreak,
  updateStreak,
} from './streak';
import { evaluateNewBadges, type BadgeStats } from './badges';

describe('src/core/gamification', () => {
  describe('xp', () => {
    it('awards 0 XP for immediate repeat, scales by rating/combo, and triples rare mastered cards', () => {
      expect(calculateTurnXp({ action: 'srs_review', rating: Rating.Good, isRepeat: true })).toBe(0);
      expect(calculateTurnXp({ action: 'srs_review', rating: Rating.Again })).toBe(2);
      expect(calculateTurnXp({ action: 'srs_review', rating: Rating.Hard })).toBe(8);
      expect(calculateTurnXp({ action: 'srs_review', rating: Rating.Good })).toBe(10);
      expect(calculateTurnXp({ action: 'srs_review', rating: Rating.Easy })).toBe(12);
      expect(
        calculateTurnXp({ action: 'srs_review', rating: Rating.Good, isRareCard: true }),
      ).toBe(30);
      expect(
        calculateTurnXp({ action: 'exam_question', correct: true, comboCount: 15 }),
      ).toBe(23); // 15 * 1.5 = 22.5 -> 23
      expect(calculateTurnXp({ action: 'exam_question', correct: false })).toBe(2);
    });

    it('detects rare mastered cards and calculates level progression', () => {
      expect(isRareMasteredCard(false, 0.001)).toBe(false);
      expect(isRareMasteredCard(true, 0.01)).toBe(true);
      expect(isRareMasteredCard(true, 0.5)).toBe(false);

      const lvl1 = xpToLevel(50);
      expect(lvl1.level).toBe(1);
      expect(lvl1.progress).toBeCloseTo(0.5);

      const lvl3 = xpToLevel(260); // 100 (L1->L2) + 150 (L2->L3) = 250 -> L3 with 10 xp
      expect(lvl3.level).toBe(3);
      expect(lvl3.currentLevelXp).toBe(10);
    });
  });

  describe('streak & Streak Freeze', () => {
    it('increments consecutive days, earns freeze every 7 days (max 2), and auto-freezes on 1 missed day', () => {
      expect(qualifiesForStreak({ cardsReviewed: 5 })).toBe(true);
      expect(qualifiesForStreak({ cardsReviewed: 2, sessionsCompleted: 0 })).toBe(false);

      let st = createInitialStreak(); // freezes = 1
      expect(checkStreakStatus(st, '2026-05-01').health).toBe('not_started');

      let res = updateStreak(st, '2026-05-01');
      st = res.state;
      expect(st.count).toBe(1);
      expect(checkStreakStatus(st, '2026-05-01').health).toBe('completed_today');
      expect(checkStreakStatus(st, '2026-05-02').health).toBe('active_at_risk');

      // Same day update is a no-op
      expect(updateStreak(st, '2026-05-01').changed).toBe(false);

      // Build up to day 7 -> earns 2nd freeze
      for (let d = 2; d <= 7; d++) {
        res = updateStreak(st, `2026-05-0${d}`);
        st = res.state;
      }
      expect(st.count).toBe(7);
      expect(res.freezeEarned).toBe(true);
      expect(st.freezes).toBe(2);

      // Skip May 8, return May 9 -> auto-uses 1 freeze!
      expect(checkStreakStatus(st, '2026-05-09').health).toBe('protected_by_freeze');
      res = updateStreak(st, '2026-05-09');
      st = res.state;
      expect(res.freezeUsed).toBe(true);
      expect(res.broken).toBe(false);
      expect(st.count).toBe(8);
      expect(st.freezes).toBe(1);
      expect(st.freezeUsedDates).toEqual(['2026-05-08']);

      // Skip 3 days -> streak breaks, longest preserved
      expect(checkStreakStatus(st, '2026-05-13').health).toBe('broken');
      res = updateStreak(st, '2026-05-13');
      expect(res.broken).toBe(true);
      expect(res.state.count).toBe(1);
      expect(res.state.longest).toBe(8);
    });
  });

  describe('badges', () => {
    it('evaluates newly unlocked badges without duplicating already unlocked ones', () => {
      const stats: BadgeStats = {
        totalSessions: 5,
        streakCount: 7,
        matureItemsCount: 120,
        masteredItemsCount: 10,
        trapsCaughtCount: 25,
        essaysRevisedCount: 1,
        mockExamsCompleted: 1,
        rareCardsSolved: 5,
        bestTfngSessionAccuracy: 0.92,
        estimatedOverallBand: 7.5,
      };
      const earned = evaluateNewBadges(stats, ['first_step']);
      const ids = earned.map((b) => b.id);
      expect(ids).not.toContain('first_step');
      expect(ids).toContain('streak_7');
      expect(ids).toContain('vocab_100_mature');
      expect(ids).toContain('trap_hunter');
      expect(ids).toContain('tfng_sharp');
      expect(ids).toContain('band_7_0');
      expect(ids).not.toContain('band_8_0');
    });
  });
});
