import { describe, expect, it } from 'vitest';
import { createNewCard, Rating } from '../../core/srs/fsrsAdapter';
import type { DictationItem } from '../../core/content/schemas';
import { L2_FIXTURES } from '../../test/fixtures/l2_fixtures';
import {
  advanceToNextSentence,
  buildL2SessionSavePayload,
  canPlayNormal,
  canPlaySlow,
  charLevenshtein,
  classifyDictationError,
  createL2Session,
  getMaxPlaysForLevel,
  gradeDictationSentence,
  L2_PERFECT_BONUS_XP,
  normalizeDictationText,
  rateDictationScore,
  recordNormalPlay,
  recordSlowPlay,
  resolveFocusTips,
  selectL2SessionItems,
  setDictationInput,
  startL2Session,
  submitCurrentSentence,
  summarizeL2Session,
} from './engine';

const makeItem = (overrides: Partial<DictationItem> = {}): DictationItem => ({
  ...L2_FIXTURES[0],
  ...overrides,
});

describe('L2 Dictation Ladder engine', () => {
  describe('normalization rules', () => {
    it('ignores punctuation and casing differences', () => {
      const item = makeItem({ text: 'The library opens at nine every morning.' });
      const graded = gradeDictationSentence(item, 'the library opens at nine every morning', {
        level: 1,
        playsUsed: 1,
        slowPlayUsed: false,
      });
      expect(graded.rawAccuracy).toBe(1);
      expect(graded.isPerfect).toBe(true);
    });

    it('treats contractions as equivalent to full forms (don\'t = do not, didn\'t = did not)', () => {
      expect(normalizeDictationText("They didn't expect it")).toBe('they did not expect it');
      expect(normalizeDictationText("Don't forget")).toBe('do not forget');
      const item = L2_FIXTURES[4]; // "They didn't expect the weather to change so quickly."
      const graded = gradeDictationSentence(
        item,
        'They did not expect the weather to change so quickly',
        { level: 3, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.rawAccuracy).toBe(1);
      expect(graded.isPerfect).toBe(true);
    });

    it('treats number words and digits as equivalent (fifteen = 15, twenty-five = 25, second = 2nd)', () => {
      expect(normalizeDictationText('fifteen galleries on the second floor')).toBe(
        '15 galleries on the 2nd floor',
      );
      expect(normalizeDictationText('twenty-five coastal sites')).toBe('25 coastal sites');
      expect(normalizeDictationText('thirty percent')).toBe('30 percent');
      expect(normalizeDictationText('30%')).toBe('30 percent');

      const item = L2_FIXTURES[3]; // "The museum has fifteen galleries on the second floor."
      const graded = gradeDictationSentence(
        item,
        'The museum has 15 galleries on the 2nd floor.',
        { level: 2, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.rawAccuracy).toBe(1);
      expect(graded.isPerfect).toBe(true);
    });

    it('treats hyphenated compounds with or without hyphens as equal (well-known = well known)', () => {
      const item = L2_FIXTURES[5]; // "This is a well-known example of renewable energy."
      const graded = gradeDictationSentence(
        item,
        'This is a well known example of renewable energy',
        { level: 3, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.rawAccuracy).toBe(1);
      expect(graded.isPerfect).toBe(true);
    });

    it('accepts UK/US spelling variants via canonicalizeSpelling', () => {
      const item = makeItem({
        text: 'The organisation analysed the harbour data.',
      });
      const graded = gradeDictationSentence(
        item,
        'The organization analyzed the harbor data.',
        { level: 4, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.rawAccuracy).toBe(1);
      expect(graded.isPerfect).toBe(true);
    });

    it('accepts acceptedVariants when provided on the item', () => {
      const item = L2_FIXTURES[11]; // has acceptedVariants without possessive 's
      const graded = gradeDictationSentence(
        item,
        'The committee recommendations were implemented across 12 regional hospitals',
        { level: 6, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.rawAccuracy).toBe(1);
      expect(graded.isPerfect).toBe(true);
    });
  });

  describe('5-type error classification', () => {
    it('classifies missing -s / -ed / -t / -d as final_consonant', () => {
      const item = makeItem({
        text: 'Students applied for the past reports.',
      });
      const graded = gradeDictationSentence(
        item,
        'Student apply for the pas report',
        { level: 4, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.errorCounts.final_consonant).toBe(4);
      expect(graded.tokens.filter((t) => t.errorType === 'final_consonant')).toHaveLength(4);
    });

    it('classifies irregular final -d/-t pairs (spend/spent) as final_consonant', () => {
      const err = classifyDictationError({
        status: 'substitution',
        expected: 'spent',
        actual: 'spend',
      });
      expect(err).toBe('final_consonant');
    });

    it('classifies missing or wrong function words as weak_form', () => {
      const item = makeItem({
        text: 'The number of students applied for the course.',
      });
      const graded = gradeDictationSentence(
        item,
        'number students applied course',
        { level: 4, playsUsed: 1, slowPlayUsed: false },
      );
      // Missing: the, of, for, the -> all 4 weak_form
      expect(graded.errorCounts.weak_form).toBe(4);
    });

    it('classifies near-miss words (edit distance <= 2, len >= 5) as spelling', () => {
      expect(charLevenshtein('methodology', 'methodolgy')).toBe(1);
      expect(charLevenshtein('sustainability', 'sustainabilty')).toBe(1);

      const item = makeItem({
        text: 'The team refined its methodology.',
      });
      const graded = gradeDictationSentence(
        item,
        'The team refined its methodolgy.',
        { level: 5, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.errorCounts.spelling).toBe(1);
      expect(graded.spellingWrongWords).toEqual(['methodology']);
    });

    it('classifies numeric mismatches as number', () => {
      const item = makeItem({
        text: 'The museum has fifteen galleries.',
      });
      const graded = gradeDictationSentence(
        item,
        'The museum has fifty galleries.',
        { level: 2, playsUsed: 1, slowPlayUsed: false },
      );
      expect(graded.errorCounts.number).toBe(1);
    });

    it('classifies unrelated substitutions, missing content words, and extra words as wrong_word', () => {
      const item = makeItem({
        text: 'Urban planners balance costs.',
      });
      const graded = gradeDictationSentence(
        item,
        'Rural planners really balance',
        { level: 5, playsUsed: 1, slowPlayUsed: false },
      );
      // Rural vs Urban (sub), really (extra), costs (missing) -> 3 wrong_word
      expect(graded.errorCounts.wrong_word).toBe(3);
    });
  });

  describe('Ladder play limits K, slow 0.75x penalty, and XP', () => {
    it('enforces max plays K by level: 1-3 => 3, 4-6 => 2, 7-10 => 1', () => {
      expect(getMaxPlaysForLevel(1)).toBe(3);
      expect(getMaxPlaysForLevel(3)).toBe(3);
      expect(getMaxPlaysForLevel(4)).toBe(2);
      expect(getMaxPlaysForLevel(6)).toBe(2);
      expect(getMaxPlaysForLevel(7)).toBe(1);
      expect(getMaxPlaysForLevel(10)).toBe(1);
    });

    it('tracks normal play consumption and stops at maxPlays', () => {
      let s = startL2Session(createL2Session(L2_FIXTURES.slice(0, 10), 7));
      expect(s.maxPlays).toBe(1);
      expect(canPlayNormal(s)).toBe(true);
      s = recordNormalPlay(s);
      expect(s.playsUsed).toBe(1);
      expect(canPlayNormal(s)).toBe(false);
      // Further recordNormalPlay is a no-op
      s = recordNormalPlay(s);
      expect(s.playsUsed).toBe(1);
    });

    it('allows 1 slow 0.75x play and deducts 30% from the sentence score', () => {
      const item = makeItem({ text: 'The library opens at nine every morning.' });
      const normalGraded = gradeDictationSentence(item, item.text, {
        level: 5,
        playsUsed: 1,
        slowPlayUsed: false,
      });
      const slowGraded = gradeDictationSentence(item, item.text, {
        level: 5,
        playsUsed: 2,
        slowPlayUsed: true,
      });

      expect(normalGraded.rawAccuracy).toBe(1);
      expect(normalGraded.effectiveScore).toBe(1);
      expect(normalGraded.isPerfect).toBe(true);
      expect(normalGraded.xpEarned).toBe(10 + L2_PERFECT_BONUS_XP);

      expect(slowGraded.rawAccuracy).toBe(1);
      expect(slowGraded.effectiveScore).toBeCloseTo(0.7, 5);
      expect(slowGraded.isPerfect).toBe(false);
      expect(slowGraded.xpEarned).toBe(7);
    });

    it('allows only one slow play per sentence in session state', () => {
      let s = startL2Session(createL2Session(L2_FIXTURES.slice(0, 10), 4));
      expect(canPlaySlow(s)).toBe(true);
      s = recordSlowPlay(s);
      expect(s.slowPlayUsed).toBe(true);
      expect(canPlaySlow(s)).toBe(false);
    });
  });

  describe('10-question session & Ladder promotion rule', () => {
    it('selects 10 items prioritized around target level', () => {
      const selected = selectL2SessionItems(L2_FIXTURES, 5, 10);
      expect(selected).toHaveLength(10);
      expect(selected[0].level).toBe(5);
      expect(selected[1].level).toBe(5);
    });

    it('recommends leveling up when >= 8/10 sentences score >= 90%', () => {
      const items = L2_FIXTURES.slice(0, 10);
      let s = startL2Session(createL2Session(items, 4, 1000), 1000);

      for (let i = 0; i < 10; i++) {
        const answer = i < 8 ? items[i].text : '';
        s = setDictationInput(s, answer);
        s = submitCurrentSentence(s, 2000 + i * 1000);
        s = advanceToNextSentence(s, 2500 + i * 1000);
      }

      expect(s.phase).toBe('recap');
      const summary = summarizeL2Session(s);
      expect(summary.completedCount).toBe(10);
      expect(summary.highScoreCount).toBe(8);
      expect(summary.shouldRecommendLevelUp).toBe(true);
      expect(summary.nextRecommendedLevel).toBe(5);
    });

    it('does NOT recommend leveling up when only 7/10 sentences reach >= 90%', () => {
      const items = L2_FIXTURES.slice(0, 10);
      let s = startL2Session(createL2Session(items, 4, 1000), 1000);

      for (let i = 0; i < 10; i++) {
        const answer = i < 7 ? items[i].text : '';
        s = setDictationInput(s, answer);
        s = submitCurrentSentence(s, 2000 + i * 1000);
        s = advanceToNextSentence(s, 2500 + i * 1000);
      }

      const summary = summarizeL2Session(s);
      expect(summary.highScoreCount).toBe(7);
      expect(summary.shouldRecommendLevelUp).toBe(false);
      expect(summary.nextRecommendedLevel).toBe(4);
    });

    it('caps ladder promotion at level 10', () => {
      const items = L2_FIXTURES.slice(0, 10);
      let s = startL2Session(createL2Session(items, 10, 1000), 1000);

      for (let i = 0; i < 10; i++) {
        s = setDictationInput(s, items[i].text);
        s = submitCurrentSentence(s, 2000 + i * 1000);
        s = advanceToNextSentence(s, 2500 + i * 1000);
      }

      const summary = summarizeL2Session(s);
      expect(summary.shouldRecommendLevelUp).toBe(false);
      expect(summary.nextRecommendedLevel).toBe(10);
    });
  });

  describe('SRS card creation & rating rules', () => {
    it('maps score to FSRS ratings: >=95% Good, 80-95% Hard, <80% Again', () => {
      expect(rateDictationScore(1)).toBe(Rating.Good);
      expect(rateDictationScore(0.95)).toBe(Rating.Good);
      expect(rateDictationScore(0.94)).toBe(Rating.Hard);
      expect(rateDictationScore(0.8)).toBe(Rating.Hard);
      expect(rateDictationScore(0.79)).toBe(Rating.Again);
      expect(rateDictationScore(0)).toBe(Rating.Again);
    });

    it('creates dict:*#dict_full card when sentence score < 70% and updates existing cards', () => {
      const items = [L2_FIXTURES[0], L2_FIXTURES[1], L2_FIXTURES[2]];
      let s = startL2Session(createL2Session(items, 1, 1000), 1000);

      // Q1: < 70% -> creates new dict:0001#dict_full (Again)
      s = setDictationInput(s, 'The library');
      s = submitCurrentSentence(s, 2000);
      s = advanceToNextSentence(s, 2500);

      // Q2: 100% -> already exists in existingCards -> updated with Good
      s = setDictationInput(s, items[1].text);
      s = submitCurrentSentence(s, 3000);
      s = advanceToNextSentence(s, 3500);

      // Q3: 100% -> not in existingCards, >= 70% -> no card created
      s = setDictationInput(s, items[2].text);
      s = submitCurrentSentence(s, 4000);
      s = advanceToNextSentence(s, 4500);

      const existing = new Map([
        [
          `${items[1].id}#dict_full`,
          createNewCard(items[1].id, 'dict_full', { source: 'dictation' }),
        ],
      ]);

      const payload = buildL2SessionSavePayload(s, existing, new Date(5000));
      expect(payload.updatedCards).toHaveLength(2);
      const ids = payload.updatedCards?.map((c) => c.id) ?? [];
      expect(ids).toContain(`${items[0].id}#dict_full`);
      expect(ids).toContain(`${items[1].id}#dict_full`);
      expect(ids).not.toContain(`${items[2].id}#dict_full`);

      const r0 = payload.reviews?.find((r) => r.cardId === `${items[0].id}#dict_full`);
      const r1 = payload.reviews?.find((r) => r.cardId === `${items[1].id}#dict_full`);
      expect(r0?.rating).toBe(Rating.Again);
      expect(r1?.rating).toBe(Rating.Good);
    });

    it('creates vocab:<word>#listen_spell card when a word has >= 2 spelling errors', () => {
      const itemA = makeItem({
        id: 'dict:sp_a',
        text: 'The methodology was clear.',
      });
      const itemB = makeItem({
        id: 'dict:sp_b',
        text: 'Our methodology improved results.',
      });
      let s = startL2Session(createL2Session([itemA, itemB], 5, 1000), 1000);

      s = setDictationInput(s, 'The methodolgy was clear.');
      s = submitCurrentSentence(s, 2000);
      s = advanceToNextSentence(s, 2500);

      s = setDictationInput(s, 'Our metodology improved results.');
      s = submitCurrentSentence(s, 3000);
      s = advanceToNextSentence(s, 3500);

      const summary = summarizeL2Session(s);
      expect(summary.listenSpellCandidates).toEqual(['methodology']);

      const payload = buildL2SessionSavePayload(s, new Map(), new Date(4000));
      const listenSpellCard = payload.updatedCards?.find(
        (c) => c.id === 'vocab:methodology#listen_spell',
      );
      expect(listenSpellCard).toBeDefined();
      expect(listenSpellCard?.face).toBe('listen_spell');
      expect(listenSpellCard?.source).toBe('dictation');
    });
  });

  describe('focus tips fallback', () => {
    it('returns data focus tips and adds generic final_consonant / weak_form tips when missing', () => {
      const item = makeItem({
        text: 'Students applied for the course.',
        focus: [
          {
            tokenIndex: 4,
            feature: 'academic',
            tipVi: 'Từ khóa học thuật "course".',
          },
        ],
      });
      const graded = gradeDictationSentence(item, 'Student apply course', {
        level: 4,
        playsUsed: 1,
        slowPlayUsed: false,
      });

      const tips = resolveFocusTips(item, graded.tokens);
      expect(tips.some((t) => t.source === 'data' && t.feature === 'academic')).toBe(true);
      expect(tips.some((t) => t.source === 'generic' && t.feature === 'final_consonant')).toBe(true);
      expect(tips.some((t) => t.source === 'generic' && t.feature === 'weak_form')).toBe(true);
    });
  });
});
