export interface NormalizeOptions {
  lowercase?: boolean;
  keepHyphens?: boolean;
  keepApostrophes?: boolean;
  keepCurrency?: boolean;
  keepDecimalDot?: boolean;
  keepColonInTime?: boolean;
  keepPercent?: boolean;
}

/**
 * Standardize curly apostrophes, quotes, and typographic dashes to ASCII.
 */
export function normalizeTypography(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\u2032`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-');
}

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Remove extraneous punctuation while preserving meaningful internal punctuation
 * (hyphens inside compound words, apostrophes inside contractions, decimals, etc.).
 */
export function stripPunctuation(
  input: string,
  options: NormalizeOptions = {},
): string {
  const {
    keepHyphens = true,
    keepApostrophes = true,
    keepCurrency = false,
    keepDecimalDot = true,
    keepColonInTime = true,
    keepPercent = false,
  } = options;

  let s = normalizeTypography(input);

  // Protect decimals (3.5), time colons (9:30), internal hyphens (check-in), internal apostrophes (don't)
  const PLACEHOLDER_DOT = '\uE001';
  const PLACEHOLDER_COLON = '\uE002';
  const PLACEHOLDER_HYPHEN = '\uE003';
  const PLACEHOLDER_APOS = '\uE004';

  if (keepDecimalDot) {
    s = s.replace(/(\d)\.(\d)/g, `$1${PLACEHOLDER_DOT}$2`);
  }
  if (keepColonInTime) {
    s = s.replace(/(\d):(\d)/g, `$1${PLACEHOLDER_COLON}$2`);
  }
  if (keepHyphens) {
    s = s.replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, `$1${PLACEHOLDER_HYPHEN}$2`);
  }
  if (keepApostrophes) {
    // Contractions & possessives like don't, o'clock, students'
    s = s.replace(/([A-Za-z])'([A-Za-z])/g, `$1${PLACEHOLDER_APOS}$2`);
    s = s.replace(/([A-Za-z]s)'(?=\s|$)/g, `$1${PLACEHOLDER_APOS}`);
  }

  const allowedExtra = [
    keepCurrency ? '£$€¥' : '',
    keepPercent ? '%' : '',
  ].join('');

  const stripPattern = new RegExp(
    `[^A-Za-z0-9\\s\\uE001\\uE002\\uE003\\uE004${allowedExtra.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`,
    'g',
  );
  s = s.replace(stripPattern, ' ');

  s = s
    .replace(/\uE001/g, '.')
    .replace(/\uE002/g, ':')
    .replace(/\uE003/g, '-')
    .replace(/\uE004/g, "'");

  return normalizeWhitespace(s);
}

/**
 * Full text normalization for comparison & matching.
 */
export function normalizeText(
  input: string,
  options: NormalizeOptions = {},
): string {
  const { lowercase = true } = options;
  let result = stripPunctuation(input, options);
  if (lowercase) {
    result = result.toLowerCase();
  }
  return normalizeWhitespace(result);
}

/**
 * Convert a word or phrase to a stable lowercase slug (e.g. "Rote Learning" -> "rote_learning").
 */
export function slugifyWord(input: string): string {
  return normalizeTypography(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
