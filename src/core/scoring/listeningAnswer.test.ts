import { describe, expect, it } from 'vitest';
import {
  checkWordLimit,
  countIeltsTokens,
  expandOptionalParentheses,
  parseWordLimit,
  scoreListeningAnswer,
} from './listeningAnswer';

describe('listeningAnswer — IELTS Listening scoring engine', () => {
  describe('parseWordLimit', () => {
    it('1. parses ONE WORD ONLY', () => {
      expect(parseWordLimit('Write ONE WORD ONLY for each answer.')).toEqual({
        maxWords: 1,
        maxNumbers: 0,
        mode: 'words_only',
      });
    });

    it('2. parses ONE WORD AND/OR A NUMBER', () => {
      expect(parseWordLimit('Write ONE WORD AND/OR A NUMBER for each answer.')).toEqual({
        maxWords: 1,
        maxNumbers: 1,
        mode: 'and_or',
      });
    });

    it('3. parses NO MORE THAN TWO WORDS', () => {
      expect(parseWordLimit('Write NO MORE THAN TWO WORDS for each answer.')).toEqual({
        maxWords: 2,
        maxNumbers: 0,
        mode: 'words_only',
      });
    });

    it('4. parses NO MORE THAN TWO WORDS AND/OR A NUMBER', () => {
      expect(
        parseWordLimit('Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.'),
      ).toEqual({
        maxWords: 2,
        maxNumbers: 1,
        mode: 'and_or',
      });
    });

    it('5. parses NO MORE THAN THREE WORDS AND/OR A NUMBER', () => {
      expect(
        parseWordLimit('Write NO MORE THAN THREE WORDS AND/OR A NUMBER.'),
      ).toEqual({
        maxWords: 3,
        maxNumbers: 1,
        mode: 'and_or',
      });
    });

    it('6. parses A NUMBER ONLY', () => {
      expect(parseWordLimit('Write A NUMBER ONLY for each answer.')).toEqual({
        maxWords: 0,
        maxNumbers: 1,
        mode: 'number_only',
      });
    });

    it('7. parses ONE WORD OR A NUMBER (exclusive)', () => {
      expect(parseWordLimit('Write ONE WORD OR A NUMBER for each answer.')).toEqual({
        maxWords: 1,
        maxNumbers: 1,
        mode: 'xor',
      });
    });

    it('8. returns null for unrecognized instruction', () => {
      expect(parseWordLimit('Choose the correct letter A, B or C.')).toBeNull();
    });
  });

  describe('token counting & word limits', () => {
    it('9. counts hyphenated word "check-in" as 1 word', () => {
      expect(countIeltsTokens('check-in')).toEqual({ wordCount: 1, numberCount: 0 });
    });

    it('10. counts multi-part hyphenated word "self-catering" as 1 word', () => {
      expect(countIeltsTokens('self-catering')).toEqual({ wordCount: 1, numberCount: 0 });
    });

    it('11. counts written compound number "two hundred and fifty" as 1 number', () => {
      expect(countIeltsTokens('two hundred and fifty')).toEqual({
        wordCount: 0,
        numberCount: 1,
      });
    });

    it('12. counts "a hundred" as 1 number', () => {
      expect(countIeltsTokens('a hundred')).toEqual({ wordCount: 0, numberCount: 1 });
    });

    it('13. counts currency symbol + number "£ 15" as 1 number', () => {
      expect(countIeltsTokens('£ 15')).toEqual({ wordCount: 0, numberCount: 1 });
    });

    it('14. counts "15 pounds" as 1 word and 1 number', () => {
      expect(countIeltsTokens('15 pounds')).toEqual({ wordCount: 1, numberCount: 1 });
    });

    it('15. rejects 2 words under ONE WORD ONLY', () => {
      const res = scoreListeningAnswer('sports centre', ['sports centre'], {
        wordLimit: 'ONE WORD ONLY',
      });
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('word_limit_exceeded');
      expect(res.withinWordLimit).toBe(false);
    });

    it('16. accepts hyphenated word under ONE WORD ONLY', () => {
      const res = scoreListeningAnswer('check-in', ['check-in'], {
        wordLimit: 'ONE WORD ONLY',
      });
      expect(res.correct).toBe(true);
      expect(res.wordCount).toBe(1);
      expect(res.withinWordLimit).toBe(true);
    });

    it('17. rejects number under ONE WORD ONLY', () => {
      const res = scoreListeningAnswer('15', ['15'], {
        wordLimit: 'ONE WORD ONLY',
      });
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('word_limit_exceeded');
    });

    it('18. accepts 1 word + 1 number under ONE WORD AND/OR A NUMBER', () => {
      const res = scoreListeningAnswer('15 pounds', ['15 pounds'], {
        wordLimit: 'ONE WORD AND/OR A NUMBER',
      });
      expect(res.correct).toBe(true);
    });

    it('19. rejects word + number together under ONE WORD OR A NUMBER', () => {
      const res = scoreListeningAnswer('15 pounds', ['15 pounds'], {
        wordLimit: 'ONE WORD OR A NUMBER',
      });
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('word_limit_exceeded');
    });

    it('20. accepts structured WordLimit { words: 2, allowNumber: true }', () => {
      const res = scoreListeningAnswer('25 Oak Street', ['25 Oak Street'], {
        wordLimit: { words: 2, allowNumber: true },
      });
      expect(res.correct).toBe(true);
    });

    it('21. rejects 3 words under { words: 2, allowNumber: true }', () => {
      const res = scoreListeningAnswer('the main sports centre', ['sports centre'], {
        wordLimit: { words: 2, allowNumber: true },
      });
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('word_limit_exceeded');
    });

    it('22. accepts number under A NUMBER ONLY and rejects words', () => {
      expect(
        scoreListeningAnswer('450', ['450'], { wordLimit: 'A NUMBER ONLY' }).correct,
      ).toBe(true);
      expect(
        scoreListeningAnswer('four fifty pounds', ['450'], { wordLimit: 'A NUMBER ONLY' })
          .reason,
      ).toBe('word_limit_exceeded');
    });

    it('23. checkWordLimit returns false on empty counts', () => {
      expect(checkWordLimit(0, 0, { maxWords: 1, maxNumbers: 0, mode: 'words_only' })).toBe(
        false,
      );
    });
  });

  describe('case, punctuation, and optional parentheses', () => {
    it('24. ignores case and extra whitespace', () => {
      const res = scoreListeningAnswer('  LIBRARY  ', ['library']);
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('exact');
    });

    it('25. expands optional parentheses "(the) library" -> both forms accepted', () => {
      expect(expandOptionalParentheses('(the) library')).toEqual(['library', 'the library']);
      const r1 = scoreListeningAnswer('library', ['(the) library']);
      const r2 = scoreListeningAnswer('the library', ['(the) library']);
      expect(r1.correct).toBe(true);
      expect(r1.reason).toBe('optional_word');
      expect(r2.correct).toBe(true);
      expect(r2.reason).toBe('optional_word');
    });

    it('26. expands nested/multiple optional words "(a) (local) guide"', () => {
      const expanded = expandOptionalParentheses('(a) (local) guide');
      expect(expanded).toContain('guide');
      expect(expanded).toContain('local guide');
      expect(expanded).toContain('a guide');
      expect(expanded).toContain('a local guide');
    });

    it('27. handles optional unit in parentheses "15 (pounds)"', () => {
      expect(scoreListeningAnswer('15', ['15 (pounds)']).correct).toBe(true);
      expect(scoreListeningAnswer('15 pounds', ['15 (pounds)']).correct).toBe(true);
    });
  });

  describe('numbers, ordinals, dates, and times', () => {
    it('28. accepts digit "15" for word "fifteen"', () => {
      const res = scoreListeningAnswer('15', ['fifteen']);
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('number_format');
    });

    it('29. accepts word "fifteen" for digit "15"', () => {
      const res = scoreListeningAnswer('fifteen', ['15']);
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('number_format');
    });

    it('30. accepts hyphenated number word "twenty-five" for "25"', () => {
      const res = scoreListeningAnswer('twenty-five', ['25']);
      expect(res.correct).toBe(true);
    });

    it('31. accepts "two hundred and fifty" for "250"', () => {
      const res = scoreListeningAnswer('two hundred and fifty', ['250']);
      expect(res.correct).toBe(true);
    });

    it('32. accepts thousands comma "1,500" for "1500"', () => {
      const res = scoreListeningAnswer('1,500', ['1500']);
      expect(res.correct).toBe(true);
    });

    it('33. accepts trailing .00 "15.00" for "15"', () => {
      const res = scoreListeningAnswer('15.00', ['15']);
      expect(res.correct).toBe(true);
    });

    it('34. accepts ordinal word "first" for "1st" and "twenty-first" for "21st"', () => {
      expect(scoreListeningAnswer('first', ['1st']).correct).toBe(true);
      expect(scoreListeningAnswer('twenty-first', ['21st']).correct).toBe(true);
    });

    it('35. accepts date permutations: "14th May", "14 May", "May 14", "May 14th", "14th of May"', () => {
      expect(scoreListeningAnswer('14 May', ['14th May']).correct).toBe(true);
      expect(scoreListeningAnswer('May 14', ['14th May']).correct).toBe(true);
      expect(scoreListeningAnswer('May 14th', ['14th May']).correct).toBe(true);
      expect(scoreListeningAnswer('14th of May', ['14th May']).correct).toBe(true);
    });

    it('36. accepts time variants "9.30 a.m." for "9:30 am"', () => {
      const res = scoreListeningAnswer('9.30 a.m.', ['9:30 am']);
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('unit_equivalent');
    });
  });

  describe('currency and measurement units', () => {
    it('37. accepts "£15" for "15 pounds" and "£15.00"', () => {
      const r1 = scoreListeningAnswer('£15', ['15 pounds']);
      const r2 = scoreListeningAnswer('£15.00', ['15 pounds']);
      const r3 = scoreListeningAnswer('fifteen pounds', ['£15']);
      expect(r1.correct).toBe(true);
      expect(r1.reason).toBe('unit_equivalent');
      expect(r2.correct).toBe(true);
      expect(r3.correct).toBe(true);
    });

    it('38. accepts "$20" for "20 dollars" and "€10" for "10 euros"', () => {
      expect(scoreListeningAnswer('$20', ['20 dollars']).correct).toBe(true);
      expect(scoreListeningAnswer('€10', ['10 euros']).correct).toBe(true);
    });

    it('39. accepts "50%" for "50 percent" and "50 per cent"', () => {
      expect(scoreListeningAnswer('50%', ['50 percent']).correct).toBe(true);
      expect(scoreListeningAnswer('50 per cent', ['50%']).correct).toBe(true);
    });

    it('40. accepts "5km", "5 km", "5 kilometres", "5 kilometers"', () => {
      expect(scoreListeningAnswer('5km', ['5 kilometres']).correct).toBe(true);
      expect(scoreListeningAnswer('5 kilometers', ['5 km']).correct).toBe(true);
    });

    it('41. accepts "2kg", "2 kilograms", "2 kilos"', () => {
      expect(scoreListeningAnswer('2kg', ['2 kilograms']).correct).toBe(true);
      expect(scoreListeningAnswer('2 kilos', ['2 kg']).correct).toBe(true);
    });

    it('42. accepts "30 mins" for "30 minutes" and "2 hrs" for "2 hours"', () => {
      expect(scoreListeningAnswer('30 mins', ['30 minutes']).correct).toBe(true);
      expect(scoreListeningAnswer('2 hrs', ['2 hours']).correct).toBe(true);
    });
  });

  describe('UK/US spelling equivalence', () => {
    it('43. accepts US "color" for UK "colour"', () => {
      const res = scoreListeningAnswer('color', ['colour']);
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('spelling_variant');
    });

    it('44. accepts UK "centre" for US "center" inside multi-word phrase', () => {
      const res = scoreListeningAnswer('sports centre', ['sports center']);
      expect(res.correct).toBe(true);
      expect(res.reason).toBe('spelling_variant');
    });

    it('45. accepts "organization" / "organisation", "traveling" / "travelling", "catalog" / "catalogue"', () => {
      expect(scoreListeningAnswer('organization', ['organisation']).correct).toBe(true);
      expect(scoreListeningAnswer('traveling', ['travelling']).correct).toBe(true);
      expect(scoreListeningAnswer('catalog', ['catalogue']).correct).toBe(true);
    });

    it('46. accepts "program" / "programme", "defense" / "defence", "license" / "licence"', () => {
      expect(scoreListeningAnswer('program', ['programme']).correct).toBe(true);
      expect(scoreListeningAnswer('defense', ['defence']).correct).toBe(true);
      expect(scoreListeningAnswer('license', ['licence']).correct).toBe(true);
    });
  });

  describe('error diagnostics (empty, plural -s, spelling, wrong answer)', () => {
    it('47. returns "empty" for blank input', () => {
      const res = scoreListeningAnswer('   ', ['library']);
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('empty');
    });

    it('48. detects missing plural -s ("student" vs "students")', () => {
      const res = scoreListeningAnswer('student', ['students']);
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('missing_plural_s');
    });

    it('49. detects missing plural -es / -ies ("box" vs "boxes", "city" vs "cities")', () => {
      expect(scoreListeningAnswer('box', ['boxes']).reason).toBe('missing_plural_s');
      expect(scoreListeningAnswer('city', ['cities']).reason).toBe('missing_plural_s');
    });

    it('50. detects extra plural -s ("informations" vs "information")', () => {
      const res = scoreListeningAnswer('informations', ['information']);
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('extra_plural_s');
    });

    it('51. detects minor spelling error on classic IELTS trap words (accommodation, February, Wednesday)', () => {
      const r1 = scoreListeningAnswer('accomodation', ['accommodation']);
      const r2 = scoreListeningAnswer('Febuary', ['February']);
      const r3 = scoreListeningAnswer('Wendesday', ['Wednesday']);
      expect(r1.correct).toBe(false);
      expect(r1.reason).toBe('minor_spelling_error');
      expect(r2.correct).toBe(false);
      expect(r2.reason).toBe('minor_spelling_error');
      expect(r3.correct).toBe(false);
      expect(r3.reason).toBe('minor_spelling_error');
    });

    it('52. marks confusable number "50" vs "15" as wrong_answer (not minor_spelling_error)', () => {
      const res = scoreListeningAnswer('50', ['15']);
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('wrong_answer');
    });

    it('53. marks unrelated answer as wrong_answer', () => {
      const res = scoreListeningAnswer('museum', ['library']);
      expect(res.correct).toBe(false);
      expect(res.reason).toBe('wrong_answer');
    });
  });
});
