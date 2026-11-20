import { describe, expect, it } from 'vitest';
import {
  scoreGapFill,
  scoreMatchingHeadings,
  scoreMCQ,
  scoreReadingAnswer,
  scoreTFNG,
  scoreYNNG,
} from './readingAnswer';

describe('readingAnswer — IELTS Reading scoring', () => {
  describe('TFNG', () => {
    it('accepts T/TRUE, F/FALSE, NG/NOT GIVEN case-insensitively', () => {
      expect(scoreTFNG('T', 'TRUE').correct).toBe(true);
      expect(scoreTFNG('true', 'TRUE').correct).toBe(true);
      expect(scoreTFNG('f', 'FALSE').correct).toBe(true);
      expect(scoreTFNG('False', 'FALSE').correct).toBe(true);
      expect(scoreTFNG('ng', 'NOT GIVEN').correct).toBe(true);
      expect(scoreTFNG('not given', 'NOT GIVEN').correct).toBe(true);
      expect(scoreTFNG('NOTGIVEN', 'NOT GIVEN').correct).toBe(true);
    });

    it('rejects YES/NO in TFNG with explicit wrong_format_ynng reason', () => {
      const r1 = scoreTFNG('YES', 'TRUE');
      const r2 = scoreTFNG('N', 'FALSE');
      expect(r1.correct).toBe(false);
      expect(r1.reason).toBe('wrong_format_ynng');
      expect(r2.correct).toBe(false);
      expect(r2.reason).toBe('wrong_format_ynng');
    });

    it('handles empty and invalid inputs', () => {
      expect(scoreTFNG('', 'TRUE').reason).toBe('empty');
      expect(scoreTFNG('maybe', 'TRUE').reason).toBe('invalid_choice');
      expect(scoreTFNG('TRUE', 'FALSE').reason).toBe('wrong_answer');
    });
  });

  describe('YNNG', () => {
    it('accepts Y/YES, N/NO, NG/NOT GIVEN', () => {
      expect(scoreYNNG('Y', 'YES').correct).toBe(true);
      expect(scoreYNNG('yes', 'YES').correct).toBe(true);
      expect(scoreYNNG('n', 'NO').correct).toBe(true);
      expect(scoreYNNG('NG', 'NOT GIVEN').correct).toBe(true);
    });

    it('rejects TRUE/FALSE in YNNG with explicit wrong_format_tfng reason', () => {
      const r1 = scoreYNNG('TRUE', 'YES');
      const r2 = scoreYNNG('F', 'NO');
      expect(r1.correct).toBe(false);
      expect(r1.reason).toBe('wrong_format_tfng');
      expect(r2.correct).toBe(false);
      expect(r2.reason).toBe('wrong_format_tfng');
    });

    it('handles empty, invalid, and wrong answers', () => {
      expect(scoreYNNG(' ', 'YES').reason).toBe('empty');
      expect(scoreYNNG('unknown', 'NO').reason).toBe('invalid_choice');
      expect(scoreYNNG('YES', 'NO').reason).toBe('wrong_answer');
    });
  });

  describe('Matching Headings', () => {
    it('scores Roman numerals case-insensitively and strips punctuation', () => {
      expect(scoreMatchingHeadings('iv', 'IV').correct).toBe(true);
      expect(scoreMatchingHeadings('vii.', 'vii').correct).toBe(true);
      expect(scoreMatchingHeadings('iii)', 'iii').correct).toBe(true);
      expect(scoreMatchingHeadings('ii', 'iv').correct).toBe(false);
      expect(scoreMatchingHeadings('', 'iv').reason).toBe('empty');
    });
  });

  describe('MCQ single & multi', () => {
    it('scores single MCQ', () => {
      expect(scoreMCQ('b', 'B').correct).toBe(true);
      expect(scoreMCQ('B.', 'B').correct).toBe(true);
      expect(scoreMCQ('A', 'B').correct).toBe(false);
      expect(scoreMCQ('', 'B').reason).toBe('empty');
    });

    it('scores multi MCQ order-independently and detects partial match', () => {
      expect(scoreMCQ(['D', 'A'], ['A', 'D']).correct).toBe(true);
      expect(scoreMCQ('d, a', ['A', 'D']).correct).toBe(true);

      const partial = scoreMCQ(['A', 'C'], ['A', 'D']);
      expect(partial.correct).toBe(false);
      expect(partial.reason).toBe('partial_match');
      expect(partial.matchedCount).toBe(1);
      expect(partial.expectedCount).toBe(2);
    });
  });

  describe('GapFill and unified dispatcher', () => {
    it('applies word limit and UK/US spelling in GapFill', () => {
      expect(
        scoreGapFill('urbanization', ['urbanisation'], 'ONE WORD ONLY').correct,
      ).toBe(true);
      expect(
        scoreGapFill('rapid urbanization', ['urbanisation'], 'ONE WORD ONLY').reason,
      ).toBe('word_limit_exceeded');
    });

    it('dispatches all question types via scoreReadingAnswer', () => {
      expect(scoreReadingAnswer({ type: 'tfng', expectedKey: 'TRUE' }, 'T').correct).toBe(true);
      expect(scoreReadingAnswer({ type: 'ynng', expectedKey: 'NO' }, 'N').correct).toBe(true);
      expect(scoreReadingAnswer({ type: 'headings', expectedKey: 'v' }, 'V').correct).toBe(true);
      expect(scoreReadingAnswer({ type: 'mcq_single', expectedKeys: 'C' }, 'c').correct).toBe(true);
      expect(
        scoreReadingAnswer(
          { type: 'gap_fill', accepted: ['photosynthesis'], wordLimit: 'ONE WORD ONLY' },
          'photosynthesis',
        ).correct,
      ).toBe(true);
    });
  });
});
