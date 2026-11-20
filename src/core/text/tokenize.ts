import { normalizeText, type NormalizeOptions } from './normalize';

export interface TokenizeOptions extends NormalizeOptions {
  /** Split hyphenated compounds into separate tokens (false = IELTS rule: check-in is 1 word). */
  splitHyphens?: boolean;
}

/**
 * Tokenize a string into clean normalized tokens.
 * By default follows IELTS conventions: hyphenated words ("check-in") and contractions ("don't")
 * remain a single token.
 */
export function tokenizeWords(
  input: string,
  options: TokenizeOptions = {},
): string[] {
  const { splitHyphens = false, ...normOpts } = options;
  const normalized = normalizeText(input, {
    keepHyphens: !splitHyphens,
    keepApostrophes: true,
    keepDecimalDot: true,
    keepColonInTime: true,
    ...normOpts,
  });
  if (!normalized) return [];
  return normalized.split(' ').filter((tok) => tok.length > 0);
}

/**
 * Count words following IELTS guidelines (hyphenated words count as 1 word).
 */
export function countIeltsWords(input: string): number {
  return tokenizeWords(input, { splitHyphens: false }).length;
}
