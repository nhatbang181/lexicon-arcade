import { describe, expect, it } from 'vitest';
import {
  normalizeText,
  normalizeTypography,
  slugifyWord,
  stripPunctuation,
} from './normalize';
import { countIeltsWords, tokenizeWords } from './tokenize';
import {
  areSpellingVariants,
  canonicalizeSpelling,
  getSpellingVariant,
} from './spellingVariants';
import { alignTranscript, detectEndingError } from './align';
import { isMinorTypo, levenshteinDistance, matchAnswer } from './answerMatch';

describe('src/core/text', () => {
  describe('normalize & tokenize', () => {
    it('normalizes curly apostrophes, dashes, and extra whitespace', () => {
      expect(normalizeTypography('“don’t” — check–in')).toBe('"don\'t" - check-in');
      expect(normalizeText('  Don’t   forget   check-in!  ')).toBe("don't forget check-in");
      expect(stripPunctuation('Cost: £15.50 at 9:30!', { keepCurrency: true })).toBe(
        'Cost £15.50 at 9:30',
      );
      expect(slugifyWord('Rote Learning!')).toBe('rote_learning');
    });

    it('tokenizes keeping hyphenated compounds as single IELTS tokens by default', () => {
      expect(tokenizeWords('Self-catering check-in desk')).toEqual([
        'self-catering',
        'check-in',
        'desk',
      ]);
      expect(countIeltsWords('Self-catering check-in desk')).toBe(3);
      expect(tokenizeWords('check-in', { splitHyphens: true })).toEqual(['check', 'in']);
      expect(tokenizeWords('   ')).toEqual([]);
    });
  });

  describe('spellingVariants', () => {
    it('maps core IELTS UK/US pairs bidirectionally', () => {
      const pairs: Array<[string, string]> = [
        ['colour', 'color'],
        ['centre', 'center'],
        ['analyse', 'analyze'],
        ['travelling', 'traveling'],
        ['catalogue', 'catalog'],
        ['programme', 'program'],
        ['organisation', 'organization'],
        ['defence', 'defense'],
        ['licence', 'license'],
        ['practise', 'practice'],
      ];
      for (const [uk, us] of pairs) {
        expect(areSpellingVariants(uk, us)).toBe(true);
        expect(canonicalizeSpelling(uk)).toBe(canonicalizeSpelling(us));
        expect(getSpellingVariant(uk)).toBe(us);
        expect(getSpellingVariant(us)).toBe(uk);
      }
    });

    it('handles -isation fallback and multi-word phrases', () => {
      expect(canonicalizeSpelling('decarbonisation')).toBe('decarbonization');
      expect(areSpellingVariants('national defence programme', 'national defense program')).toBe(
        true,
      );
      expect(areSpellingVariants('cat', 'dog')).toBe(false);
      expect(getSpellingVariant('apple')).toBeNull();
    });
  });

  describe('align (Dictation L2 word-level Levenshtein)', () => {
    it('aligns identical sentences with 100% accuracy and UK/US tolerance', () => {
      const res = alignTranscript(
        'The organisation analysed the urban centre.',
        'The organization analyzed the urban center',
      );
      expect(res.accuracy).toBe(1);
      expect(res.wer).toBe(0);
      expect(res.counts.correct).toBe(6);
    });

    it('classifies missing, extra, substitution, and ending_error (-s/-es/-ed/-ing)', () => {
      const res = alignTranscript(
        'Students studied modern cities very carefully',
        'Student study ancient city very quickly indeed',
      );
      const statuses = res.tokens.map((t) => t.status);
      expect(statuses).toContain('ending_error');
      expect(statuses).toContain('substitution');
      expect(statuses).toContain('extra');
      expect(res.counts.ending_error).toBe(3); // Students/Student, studied/study, cities/city
      expect(res.counts.substitution).toBe(2); // modern/ancient, carefully/quickly
      expect(res.counts.extra).toBe(1); // indeed
    });

    it('detects missing tokens and empty inputs cleanly', () => {
      const res = alignTranscript('We need more funding now', 'We need now');
      expect(res.counts.missing).toBe(2);
      expect(res.counts.correct).toBe(3);

      const empty = alignTranscript('', '');
      expect(empty.accuracy).toBe(1);
      expect(empty.tokens).toEqual([]);
    });

    it('detectEndingError identifies -s, -es, -ies, -ed, doubled consonant -ed, and -ing', () => {
      expect(detectEndingError('books', 'book')).toBe('missing_-s');
      expect(detectEndingError('watches', 'watch')).toBe('missing_-es');
      expect(detectEndingError('cities', 'city')).toBe('missing_-ies');
      expect(detectEndingError('walked', 'walk')).toBe('missing_-ed');
      expect(detectEndingError('stopped', 'stop')).toBe('missing_-ed');
      expect(detectEndingError('making', 'make')).toBe('missing_-ing');
      expect(detectEndingError('book', 'books')).toBe('extra_-s');
      expect(detectEndingError('cat', 'dog')).toBeNull();
    });
  });

  describe('answerMatch', () => {
    it('computes Damerau-Levenshtein distance including transposition', () => {
      expect(levenshteinDistance('receive', 'recieve')).toBe(1);
      expect(levenshteinDistance('', 'abc')).toBe(3);
      expect(isMinorTypo('recieve', 'receive')).toBe(true);
      expect(isMinorTypo('cat', 'bat')).toBe(false); // too short (<4)
    });

    it('matches exact, spelling variants, optional leading article, and minor typos', () => {
      expect(matchAnswer('colour', ['color']).isSpellingVariant).toBe(true);
      expect(
        matchAnswer('the curriculum', ['curriculum'], { ignoreLeadingArticle: true }).matched,
      ).toBe(true);

      const strictTypo = matchAnswer('curiculum', ['curriculum'], { allowMinorTypo: false });
      expect(strictTypo.matched).toBe(false);
      expect(strictTypo.isTypo).toBe(true);

      const softTypo = matchAnswer('curiculum', ['curriculum'], { allowMinorTypo: true });
      expect(softTypo.matched).toBe(true);
      expect(softTypo.isTypo).toBe(true);

      expect(matchAnswer('', ['curriculum']).matched).toBe(false);
    });
  });
});
