import { normalizeTypography, normalizeWhitespace } from '../text/normalize';
import { canonicalizeSpelling } from '../text/spellingVariants';
import { levenshteinDistance } from '../text/answerMatch';
import { detectEndingError } from '../text/align';

export interface WordLimitSpec {
  maxWords: number;
  maxNumbers: number;
  /** 'words_only' | 'number_only' | 'and_or' | 'xor' */
  mode: 'words_only' | 'number_only' | 'and_or' | 'xor';
}

export type WordLimitInput =
  | string
  | WordLimitSpec
  | { words: number; allowNumber: boolean };

export type ListeningScoreReason =
  | 'exact'
  | 'spelling_variant'
  | 'number_format'
  | 'unit_equivalent'
  | 'optional_word'
  | 'empty'
  | 'word_limit_exceeded'
  | 'missing_plural_s'
  | 'extra_plural_s'
  | 'minor_spelling_error'
  | 'wrong_answer';

export interface ListeningScoreResult {
  correct: boolean;
  reason: ListeningScoreReason;
  matchedAnswer?: string;
  wordCount: number;
  numberCount: number;
  withinWordLimit: boolean;
  feedbackVi?: string;
}

export interface ScoreListeningOptions {
  wordLimit?: WordLimitInput;
  /** Unit already printed next to the blank (e.g. "£", "km", "%"). The user may omit or repeat it (L1-05). */
  promptUnit?: string;
}

export interface CountTokensOptions {
  /**
   * `words_only` limits ("NO MORE THAN TWO WORDS"): spoken number words such as "second", "first",
   * "twenty-five" are ordinary WORDS; only real digits count as numbers (L1-06).
   */
  numberWordsAsWords?: boolean;
}

export interface CanonicalizeOptions {
  /** Canonical unit words ("pounds", "dollars", "euros", "percent", "km"…) to drop after a number (L1-05). */
  dropUnitWords?: readonly string[];
}

const ONES: Record<string, number> = {
  zero: 0,
  oh: 0,
  nought: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALES: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  million: 1_000_000,
};

const ORDINAL_WORDS: Record<string, string> = {
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
  fifth: '5th',
  sixth: '6th',
  seventh: '7th',
  eighth: '8th',
  ninth: '9th',
  tenth: '10th',
  eleventh: '11th',
  twelfth: '12th',
  thirteenth: '13th',
  fourteenth: '14th',
  fifteenth: '15th',
  sixteenth: '16th',
  seventeenth: '17th',
  eighteenth: '18th',
  nineteenth: '19th',
  twentieth: '20th',
  'twenty-first': '21st',
  'twenty-second': '22nd',
  'twenty-third': '23rd',
  'twenty-fourth': '24th',
  'twenty-fifth': '25th',
  'twenty-sixth': '26th',
  'twenty-seventh': '27th',
  'twenty-eighth': '28th',
  'twenty-ninth': '29th',
  thirtieth: '30th',
  'thirty-first': '31st',
};

const MONTHS: Record<string, string> = {
  jan: 'january',
  january: 'january',
  feb: 'february',
  february: 'february',
  mar: 'march',
  march: 'march',
  apr: 'april',
  april: 'april',
  may: 'may',
  jun: 'june',
  june: 'june',
  jul: 'july',
  july: 'july',
  aug: 'august',
  august: 'august',
  sep: 'september',
  sept: 'september',
  september: 'september',
  oct: 'october',
  october: 'october',
  nov: 'november',
  november: 'november',
  dec: 'december',
  december: 'december',
};

const WORD_COUNT_MAP: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
};

/**
 * Parse official IELTS instruction strings like:
 * - "Write ONE WORD ONLY for each answer."
 * - "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer."
 * - "Write ONE WORD OR A NUMBER."
 * - "Write A NUMBER ONLY."
 */
export function parseWordLimit(instruction: string): WordLimitSpec | null {
  const s = instruction.toUpperCase();

  if (/\bA\s+NUMBER\s+ONLY\b/.test(s) || /\bONE\s+NUMBER\s+ONLY\b/.test(s)) {
    return { maxWords: 0, maxNumbers: 1, mode: 'number_only' };
  }

  const wordMatch = s.match(
    /(?:NO\s+MORE\s+THAN\s+)?(ONE|TWO|THREE|FOUR|1|2|3|4)\s+WORDS?/,
  );
  if (!wordMatch) return null;

  const maxWords = WORD_COUNT_MAP[wordMatch[1].toLowerCase()] ?? 1;

  if (/AND\/OR\s+A\s+NUMBER/.test(s) || /AND\/OR\s+NUMBERS/.test(s)) {
    return { maxWords, maxNumbers: 1, mode: 'and_or' };
  }
  if (/\bOR\s+A\s+NUMBER\b/.test(s)) {
    return { maxWords, maxNumbers: 1, mode: 'xor' };
  }
  if (/\bAND\s+A\s+NUMBER\b/.test(s)) {
    return { maxWords, maxNumbers: 1, mode: 'and_or' };
  }
  return { maxWords, maxNumbers: 0, mode: 'words_only' };
}

export function normalizeWordLimit(input?: WordLimitInput): WordLimitSpec | null {
  if (!input) return null;
  if (typeof input === 'string') return parseWordLimit(input);
  if ('mode' in input) return input;
  return {
    maxWords: input.words,
    maxNumbers: input.allowNumber ? 1 : 0,
    mode: input.allowNumber ? 'and_or' : 'words_only',
  };
}

function isNumberWordToken(tok: string): boolean {
  if (tok in ONES || tok in TENS || tok in SCALES || tok in ORDINAL_WORDS) {
    return true;
  }
  if (tok.includes('-')) {
    const parts = tok.split('-');
    if (parts.length === 2 && parts[0] in TENS && (parts[1] in ONES || parts[1] in ORDINAL_WORDS)) {
      return true;
    }
  }
  return false;
}

/**
 * Parse an array of number-word tokens (e.g. ["two", "hundred", "and", "fifty"]) into a numeric string.
 */
function parseNumberWords(tokens: string[]): string | null {
  if (tokens.length === 0) return null;

  // Single ordinal word
  if (tokens.length === 1 && tokens[0] in ORDINAL_WORDS) {
    return ORDINAL_WORDS[tokens[0]];
  }
  // Two-word ordinal like "twenty first"
  if (tokens.length === 2 && tokens[0] in TENS && tokens[1] in ORDINAL_WORDS) {
    const joined = `${tokens[0]}-${tokens[1]}`;
    if (joined in ORDINAL_WORDS) return ORDINAL_WORDS[joined];
  }

  // Expand hyphenated numbers like "twenty-five" -> ["twenty", "five"]
  const flat: string[] = [];
  for (const t of tokens) {
    if (t === 'and') continue;
    if (t.includes('-')) {
      const parts = t.split('-');
      if (parts.length === 2 && parts[0] in TENS && parts[1] in ONES) {
        flat.push(parts[0], parts[1]);
        continue;
      }
      return null;
    }
    flat.push(t);
  }
  if (flat.length === 0) return null;

  let total = 0;
  let current = 0;
  let sawValid = false;

  for (const word of flat) {
    if (word in ONES) {
      current += ONES[word];
      sawValid = true;
    } else if (word in TENS) {
      current += TENS[word];
      sawValid = true;
    } else if (word === 'hundred') {
      current = (current === 0 ? 1 : current) * 100;
      sawValid = true;
    } else if (word === 'thousand') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      sawValid = true;
    } else if (word === 'million') {
      total += (current === 0 ? 1 : current) * 1_000_000;
      current = 0;
      sawValid = true;
    } else {
      return null;
    }
  }

  if (!sawValid) return null;
  return String(total + current);
}

/**
 * Join digit groups of long numbers: "07741 829 360" -> "07741829360", "0121-496-0123" -> "01214960123" (L1-02).
 * IELTS treats a phone/reference number written in groups as ONE number. Requires ≥ 6 digits in total so that
 * short sequences like "10 30" or "2024-25" stay untouched.
 */
export function collapseDigitGroups(input: string): string {
  const join = (m: string, sep: RegExp) => {
    const digits = m.replace(sep, '');
    return digits.length >= 6 ? digits : m;
  };
  return input
    .replace(/(?<![\d:]|\d\.)\d{2,}(?: \d{2,})+(?![\d:]|\.\d)/g, (m) => join(m, / /g))
    .replace(/(?<![\d:]|\d\.)\d{2,}(?:-\d{2,}){2,}(?![\d:]|\.\d)/g, (m) => join(m, /-/g));
}

const HOUR_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const MINUTE_TEENS: Record<string, number> = {
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const MINUTE_TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50 };

function hourValue(tok: string | undefined): number | null {
  if (!tok) return null;
  return tok in HOUR_WORDS ? HOUR_WORDS[tok] : null;
}

function formatClock(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

/**
 * Parse a spoken clock time starting at `tokens[i]` (L1-04):
 * "nine thirty" / "nine forty five" / "nine oh five" / "nine o'clock" / "half past nine" /
 * "quarter past ten" / "quarter to ten" -> "9:30" / "9:45" / "9:05" / "9:00" / "9:30" / "10:15" / "9:45".
 */
export function parseSpokenTime(
  tokens: readonly string[],
  i: number,
): { text: string; consumed: number } | null {
  const t = tokens[i];
  if (t === 'half' && tokens[i + 1] === 'past') {
    const h = hourValue(tokens[i + 2]);
    if (h !== null) return { text: formatClock(h, 30), consumed: 3 };
  }
  if (t === 'quarter' && (tokens[i + 1] === 'past' || tokens[i + 1] === 'to')) {
    const h = hourValue(tokens[i + 2]);
    if (h !== null) {
      return tokens[i + 1] === 'past'
        ? { text: formatClock(h, 15), consumed: 3 }
        : { text: formatClock(h === 1 ? 12 : h - 1, 45), consumed: 3 };
    }
  }
  const h = hourValue(t);
  if (h === null) return null;
  const next = tokens[i + 1];
  if (next === "o'clock" || next === 'oclock') return { text: formatClock(h, 0), consumed: 2 };
  if (next === 'oh' && tokens[i + 2] in ONES && ONES[tokens[i + 2]] >= 1 && ONES[tokens[i + 2]] <= 9) {
    return { text: formatClock(h, ONES[tokens[i + 2]]), consumed: 3 };
  }
  if (next !== undefined && next in MINUTE_TEENS) return { text: formatClock(h, MINUTE_TEENS[next]), consumed: 2 };
  if (next !== undefined && next in MINUTE_TENS) {
    const unit = tokens[i + 2];
    if (unit !== undefined && unit in ONES && ONES[unit] >= 1 && ONES[unit] <= 9) {
      return { text: formatClock(h, MINUTE_TENS[next] + ONES[unit]), consumed: 3 };
    }
    return { text: formatClock(h, MINUTE_TENS[next]), consumed: 2 };
  }
  return null;
}

const UNIT_WORD_OF_SYMBOL: Record<string, string> = { '£': 'pounds', $: 'dollars', '€': 'euros', '%': 'percent' };
const CURRENCY_WORDS = ['pounds', 'dollars', 'euros'] as const;

const NUMERIC_TOKEN_REGEX =
  /^[£$€¥]?\d+(?:[.,:]\d+)*(?:st|nd|rd|th|%|km|m|cm|mm|kg|g|mg|l|ml|hrs?|mins?|secs?|am|pm|a\.m\.|p\.m\.)?$/i;

function isNumericToken(tok: string): boolean {
  return NUMERIC_TOKEN_REGEX.test(tok);
}

/**
 * Count IELTS words and numbers in a candidate answer.
 * - Hyphenated words ("check-in") count as 1 word.
 * - Digits, currency numbers (£15), percentages (50%), times (9:30), ordinals (14th),
 *   and written number phrases ("fifteen", "two hundred") count as 1 number.
 */
export function countIeltsTokens(
  input: string,
  options: CountTokensOptions = {},
): { wordCount: number; numberCount: number } {
  const cleaned = collapseDigitGroups(
    normalizeTypography(input)
      .toLowerCase()
      .replace(/(\d),(\d{3})/g, '$1$2')
      .replace(/[,;!?"]/g, ' ')
      .replace(/\(([^)]*)\)/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

  if (!cleaned) return { wordCount: 0, numberCount: 0 };

  // Strip trailing periods unless part of a.m./p.m. or decimal
  const rawTokens = cleaned
    .split(' ')
    .map((t) => {
      if (/^(?:a\.m\.|p\.m\.)$/i.test(t)) return t;
      return t.replace(/^\.+|\.+$/g, '');
    })
    .filter((t) => t.length > 0);

  let wordCount = 0;
  let numberCount = 0;
  let i = 0;

  while (i < rawTokens.length) {
    const tok = rawTokens[i];

    // Numeric token (digit, £15, 9:30, 14th, 50%, 5km...)
    if (isNumericToken(tok)) {
      numberCount++;
      i++;
      continue;
    }

    // Standalone currency symbol followed by number ("£ 15")
    if (/^[£$€¥]$/.test(tok) && i + 1 < rawTokens.length && isNumericToken(rawTokens[i + 1])) {
      numberCount++;
      i += 2;
      continue;
    }

    // Spoken clock time ("nine thirty", "half past nine") is ONE number (L1-04)
    if (!options.numberWordsAsWords) {
      const spoken = parseSpokenTime(rawTokens, i);
      if (spoken) {
        numberCount++;
        i += spoken.consumed;
        continue;
      }
    }

    // Number word sequence ("fifteen", "twenty-five", "two hundred and fifty", "a hundred")
    if (
      !options.numberWordsAsWords &&
      (isNumberWordToken(tok) ||
      ((tok === 'a' || tok === 'an') &&
        i + 1 < rawTokens.length &&
        (rawTokens[i + 1] === 'hundred' ||
          rawTokens[i + 1] === 'thousand' ||
          rawTokens[i + 1] === 'million')))
    ) {
      let j = i;
      const seq: string[] = [];
      if (tok === 'a' || tok === 'an') {
        seq.push('one');
        j++;
      }
      while (j < rawTokens.length) {
        const cur = rawTokens[j];
        if (isNumberWordToken(cur)) {
          seq.push(cur);
          j++;
        } else if (
          cur === 'and' &&
          j + 1 < rawTokens.length &&
          isNumberWordToken(rawTokens[j + 1])
        ) {
          seq.push(cur);
          j++;
        } else {
          break;
        }
      }
      if (parseNumberWords(seq) !== null) {
        numberCount++;
        i = j;
        continue;
      }
    }

    // Regular word (hyphenated compound like "check-in" is 1 token = 1 word)
    wordCount++;
    i++;
  }

  return { wordCount, numberCount };
}

export function checkWordLimit(
  wordCount: number,
  numberCount: number,
  limit: WordLimitSpec | null,
): boolean {
  if (!limit) return true;
  if (wordCount === 0 && numberCount === 0) return false;

  switch (limit.mode) {
    case 'words_only':
      return wordCount <= limit.maxWords && numberCount === 0;
    case 'number_only':
      return wordCount === 0 && numberCount <= limit.maxNumbers;
    case 'xor':
      return (
        (wordCount <= limit.maxWords && numberCount === 0) ||
        (wordCount === 0 && numberCount <= limit.maxNumbers)
      );
    case 'and_or':
      return wordCount <= limit.maxWords && numberCount <= limit.maxNumbers;
  }
}

/**
 * Expand optional parenthetical segments in accepted answers, e.g.:
 * "(the) library" -> ["library", "the library"]
 * "a (small) fee" -> ["a fee", "a small fee"]
 */
export function expandOptionalParentheses(answer: string): string[] {
  const match = answer.match(/\(([^()]+)\)/);
  if (!match) {
    return [normalizeWhitespace(answer)];
  }
  const fullMatch = match[0];
  const inner = match[1];
  const idx = match.index ?? 0;
  const before = answer.slice(0, idx);
  const after = answer.slice(idx + fullMatch.length);

  const withoutOpt = expandOptionalParentheses(`${before} ${after}`);
  const withOpt = expandOptionalParentheses(`${before} ${inner} ${after}`);

  return Array.from(new Set([...withoutOpt, ...withOpt]));
}

/**
 * Normalize numeric expressions, currencies, units, times, and dates into a canonical form
 * for IELTS equivalence checks.
 */
export function canonicalizeIeltsExpression(
  input: string,
  options: CanonicalizeOptions = {},
): {
  canonical: string;
  usedNumberConversion: boolean;
  usedUnitConversion: boolean;
  usedSpellingVariant: boolean;
} {
  let usedNumberConversion = false;
  let usedUnitConversion = false;
  let usedSpellingVariant = false;

  let s = normalizeTypography(input)
    .toLowerCase()
    .replace(/[,;!?"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Normalize a.m. / p.m.
  if (/\b(a\.m\.|p\.m\.)\b/.test(s)) {
    s = s.replace(/\ba\.m\.\b/g, 'am').replace(/\bp\.m\.\b/g, 'pm');
    usedUnitConversion = true;
  }

  // Strip commas inside numbers like "1,500" -> "1500" (already replaced comma with space above? Let's do before!)
  const rawNoThousands = normalizeTypography(input)
    .toLowerCase()
    .replace(/(\d),(\d{3})\b/g, '$1$2')
    .replace(/[,;!?"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  s = collapseDigitGroups(rawNoThousands)
    .replace(/\ba\.m\.?/g, 'am')
    .replace(/\bp\.m\.?/g, 'pm');

  // Convert currency prefix symbols to canonical "<num> <currency>"
  const beforeCurr = s;
  s = s
    .replace(/£\s*(\d+(?:\.\d+)?)/g, '$1 pounds')
    .replace(/\$\s*(\d+(?:\.\d+)?)/g, '$1 dollars')
    .replace(/€\s*(\d+(?:\.\d+)?)/g, '$1 euros');
  if (s !== beforeCurr) usedUnitConversion = true;

  // Convert attached units like "50%", "5km", "10m", "2kg", "30mins", "9:30am"
  const beforeAttach = s;
  s = s
    .replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent')
    .replace(/\bper\s+cent\b/g, 'percent')
    .replace(/(\d+(?:\.\d+)?)\s*(km|kilometres?|kilometers?)\b/g, '$1 km')
    .replace(/(\d+(?:\.\d+)?)\s*(cm|centimetres?|centimeters?)\b/g, '$1 cm')
    .replace(/(\d+(?:\.\d+)?)\s*(mm|millimetres?|millimeters?)\b/g, '$1 mm')
    .replace(/(\d+(?:\.\d+)?)\s*(m|metres?|meters?)\b/g, '$1 m')
    .replace(/(\d+(?:\.\d+)?)\s*(kg|kilograms?|kilogrammes?|kilos?)\b/g, '$1 kg')
    .replace(/(\d+(?:\.\d+)?)\s*(mins?|minutes?)\b/g, '$1 minutes')
    .replace(/(\d+(?:\.\d+)?)\s*(hrs?|hours?)\b/g, '$1 hours')
    .replace(/(\d+(?:\.\d+)?)\s*(pounds?|gbp)\b/g, '$1 pounds')
    .replace(/(\d+(?:\.\d+)?)\s*(dollars?|usd)\b/g, '$1 dollars')
    .replace(/(\d+(?:\.\d+)?)\s*(euros?|eur)\b/g, '$1 euros')
    .replace(/(\d{1,2}):(\d{2})\s*(am|pm)?\b/g, (_, h: string, m: string, mer?: string) => {
      return `${Number(h)}:${m}${mer ? ` ${mer}` : ''}`;
    })
    .replace(/(\d{1,2})\.(\d{2})\s*(am|pm)\b/g, (_, h: string, m: string, mer: string) => {
      return `${Number(h)}:${m} ${mer}`;
    });
  if (s !== beforeAttach) usedUnitConversion = true;

  // L1-05: the unit/currency is printed next to the blank, so "£12.50" and "12.50" are the same answer.
  if (options.dropUnitWords && options.dropUnitWords.length > 0) {
    const unitAlt = options.dropUnitWords.join('|');
    const beforeDrop = s;
    s = s.replace(new RegExp(String.raw`(\d+(?:\.\d+)?)\s*(?:${unitAlt})\b`, 'g'), '$1');
    if (s !== beforeDrop) usedUnitConversion = true;
  }

  // L1-03: "9.30" is the time 9:30 even without am/pm (hour ≤ 24, minute < 60, not a money/unit amount).
  const beforeTime = s;
  s = s.replace(
    /(?<![\d.:])(\d{1,2})\.(?!00)(\d{2})(?![\d.])(?!\s*(?:pounds|dollars|euros|percent|km|cm|mm|m|kg|minutes|hours)\b)/g,
    (m: string, h: string, mi: string) => (Number(h) <= 24 && Number(mi) < 60 ? `${Number(h)}:${mi}` : m),
  );
  if (s !== beforeTime) usedNumberConversion = true;

  // Strip trailing .00 on numbers (15.00 -> 15)
  const beforeZero = s;
  s = s.replace(/\b(\d+)\.00\b/g, '$1');
  if (s !== beforeZero) usedNumberConversion = true;

  // Convert number words to digits
  const rawTokens = s
    .split(' ')
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter((t) => t.length > 0);

  const outTokens: string[] = [];
  let i = 0;
  while (i < rawTokens.length) {
    const tok = rawTokens[i];
    const spoken = parseSpokenTime(rawTokens, i);
    if (spoken) {
      outTokens.push(spoken.text);
      usedNumberConversion = true;
      i += spoken.consumed;
      continue;
    }
    if (
      isNumberWordToken(tok) ||
      ((tok === 'a' || tok === 'an') &&
        i + 1 < rawTokens.length &&
        (rawTokens[i + 1] === 'hundred' ||
          rawTokens[i + 1] === 'thousand' ||
          rawTokens[i + 1] === 'million'))
    ) {
      let j = i;
      const seq: string[] = [];
      if (tok === 'a' || tok === 'an') {
        seq.push('one');
        j++;
      }
      while (j < rawTokens.length) {
        const cur = rawTokens[j];
        if (isNumberWordToken(cur)) {
          seq.push(cur);
          j++;
        } else if (
          cur === 'and' &&
          j + 1 < rawTokens.length &&
          isNumberWordToken(rawTokens[j + 1])
        ) {
          seq.push(cur);
          j++;
        } else {
          break;
        }
      }
      const parsed = parseNumberWords(seq);
      if (parsed !== null) {
        outTokens.push(parsed);
        usedNumberConversion = true;
        i = j;
        continue;
      }
    }

    const canonWord = canonicalizeSpelling(tok);
    if (canonWord !== tok) {
      usedSpellingVariant = true;
    }
    outTokens.push(canonWord);
    i++;
  }

  let canonical = outTokens
    .join(' ')
    // "9:00" / "nine o'clock" == "9" (no am/pm): same hour either way
    .replace(/(?<![\d:])(\d{1,2}):00(?!\d|:|\s*(?:am|pm))/g, '$1');

  // Normalize dates: "14th may" / "14 may" / "14th of may" / "may 14th" / "may 14" -> "14 may"
  const dateDayFirst = canonical.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)$/);
  if (dateDayFirst && dateDayFirst[2] in MONTHS) {
    const normalizedDate = `${Number(dateDayFirst[1])} ${MONTHS[dateDayFirst[2]]}`;
    if (normalizedDate !== canonical) usedNumberConversion = true;
    canonical = normalizedDate;
  } else {
    const dateMonthFirst = canonical.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/);
    if (dateMonthFirst && dateMonthFirst[1] in MONTHS) {
      const normalizedDate = `${Number(dateMonthFirst[2])} ${MONTHS[dateMonthFirst[1]]}`;
      if (normalizedDate !== canonical) usedNumberConversion = true;
      canonical = normalizedDate;
    }
  }

  // Re-run unit normalization in case number words preceded unit ("fifteen pounds" -> "15 pounds")
  const postUnit = canonical
    .replace(/\b(\d+(?:\.\d+)?)\s*(pounds?|gbp)\b/g, '$1 pounds')
    .replace(/\b(\d+(?:\.\d+)?)\s*(dollars?|usd)\b/g, '$1 dollars')
    .replace(/\b(\d+(?:\.\d+)?)\s*(euros?|eur)\b/g, '$1 euros')
    .replace(/\b(\d+(?:\.\d+)?)\s*per\s+cent\b/g, '$1 percent')
    .replace(/\b(\d+(?:\.\d+)?)\s*(km|kilometres?|kilometers?)\b/g, '$1 km')
    .replace(/\b(\d+(?:\.\d+)?)\s*(m|metres?|meters?)\b/g, '$1 m')
    .replace(/\b(\d+(?:\.\d+)?)\s*(kg|kilograms?|kilogrammes?|kilos?)\b/g, '$1 kg')
    .replace(/\b(\d+(?:\.\d+)?)\s*(mins?|minutes?)\b/g, '$1 minutes')
    .replace(/\b(\d+(?:\.\d+)?)\s*(hrs?|hours?)\b/g, '$1 hours');
  if (postUnit !== canonical) {
    usedUnitConversion = true;
    canonical = postUnit;
  }

  return {
    canonical,
    usedNumberConversion,
    usedUnitConversion,
    usedSpellingVariant,
  };
}

function basicNormalize(s: string): string {
  return collapseDigitGroups(
    normalizeTypography(s)
      .toLowerCase()
      .replace(/[.,;!?"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function unitWordsForPrompt(promptUnit: string | undefined): string[] {
  const raw = (promptUnit ?? '').trim().toLowerCase();
  if (!raw) return [];
  if (raw in UNIT_WORD_OF_SYMBOL) return [UNIT_WORD_OF_SYMBOL[raw]];
  const word = canonicalizeIeltsExpression(`1 ${raw}`).canonical.split(' ')[1];
  return word ? [word] : [];
}

/**
 * Score an IELTS Listening answer according to official examiner conventions.
 */
export function scoreListeningAnswer(
  userAnswer: string,
  acceptedAnswers: readonly string[],
  options: ScoreListeningOptions = {},
): ListeningScoreResult {
  const trimmed = normalizeWhitespace(userAnswer);
  if (!trimmed) {
    return {
      correct: false,
      reason: 'empty',
      wordCount: 0,
      numberCount: 0,
      withinWordLimit: false,
      feedbackVi: 'Bạn chưa nhập đáp án.',
    };
  }

  const limit = normalizeWordLimit(options.wordLimit);
  // L1-06: under "NO MORE THAN N WORDS" (no number allowed) "second floor" is two ordinary words.
  const { wordCount, numberCount } = countIeltsTokens(trimmed, {
    numberWordsAsWords: limit?.mode === 'words_only',
  });
  const withinWordLimit = checkWordLimit(wordCount, numberCount, limit);

  if (!withinWordLimit) {
    return {
      correct: false,
      reason: 'word_limit_exceeded',
      wordCount,
      numberCount,
      withinWordLimit: false,
      feedbackVi: `Vượt giới hạn từ cho phép (${wordCount} từ, ${numberCount} số).`,
    };
  }

  // Expand all accepted answers with optional parenthetical words
  const expanded: Array<{ original: string; candidate: string; fromOptional: boolean }> = [];
  for (const acc of acceptedAnswers) {
    const hasOpt = /\([^()]+\)/.test(acc);
    for (const variant of expandOptionalParentheses(acc)) {
      expanded.push({ original: acc, candidate: variant, fromOptional: hasOpt });
    }
  }

  const userBasic = basicNormalize(trimmed);
  const userCanon = canonicalizeIeltsExpression(trimmed);

  // 1. Exact basic match
  for (const item of expanded) {
    if (userBasic === basicNormalize(item.candidate)) {
      return {
        correct: true,
        reason: item.fromOptional ? 'optional_word' : 'exact',
        matchedAnswer: item.original,
        wordCount,
        numberCount,
        withinWordLimit: true,
      };
    }
  }

  // 2. Canonical match (UK/US spelling, number format, unit/currency/date equivalence)
  for (const item of expanded) {
    const accCanon = canonicalizeIeltsExpression(item.candidate);
    if (userCanon.canonical === accCanon.canonical) {
      let reason: ListeningScoreReason = 'exact';
      if (item.fromOptional) {
        reason = 'optional_word';
      } else if (userCanon.usedUnitConversion || accCanon.usedUnitConversion) {
        reason = 'unit_equivalent';
      } else if (userCanon.usedNumberConversion || accCanon.usedNumberConversion) {
        reason = 'number_format';
      } else if (userCanon.usedSpellingVariant || accCanon.usedSpellingVariant) {
        reason = 'spelling_variant';
      }
      return {
        correct: true,
        reason,
        matchedAnswer: item.original,
        wordCount,
        numberCount,
        withinWordLimit: true,
      };
    }
  }

  // 2b. Unit/currency printed next to the blank (L1-05): "£12.50" == "12.50" == "12.50 pounds"
  const dropUnitWords = options.promptUnit
    ? unitWordsForPrompt(options.promptUnit)
    : [...CURRENCY_WORDS];
  const userNoUnit = canonicalizeIeltsExpression(trimmed, { dropUnitWords });
  for (const item of expanded) {
    const accNoUnit = canonicalizeIeltsExpression(item.candidate, { dropUnitWords });
    if (userNoUnit.canonical === accNoUnit.canonical) {
      return {
        correct: true,
        reason: 'unit_equivalent',
        matchedAnswer: item.original,
        wordCount,
        numberCount,
        withinWordLimit: true,
      };
    }
  }

  // 3. Diagnose specific IELTS failure reasons: missing/extra plural -s or minor spelling error
  for (const item of expanded) {
    const accCanon = canonicalizeIeltsExpression(item.candidate).canonical;
    const uToks = userCanon.canonical.split(' ');
    const aToks = accCanon.split(' ');

    if (uToks.length === aToks.length) {
      let diffCount = 0;
      let diffEnding: string | null = null;
      for (let i = 0; i < uToks.length; i++) {
        if (uToks[i] !== aToks[i]) {
          diffCount++;
          diffEnding = detectEndingError(aToks[i], uToks[i]);
        }
      }
      if (diffCount === 1 && diffEnding) {
        if (
          diffEnding === 'missing_-s' ||
          diffEnding === 'missing_-es' ||
          diffEnding === 'missing_-ies'
        ) {
          return {
            correct: false,
            reason: 'missing_plural_s',
            wordCount,
            numberCount,
            withinWordLimit: true,
            feedbackVi: `Thiếu đuôi số nhiều (-s/-es). Đáp án đúng: "${item.candidate}".`,
          };
        }
        if (
          diffEnding === 'extra_-s' ||
          diffEnding === 'extra_-es' ||
          diffEnding === 'extra_-ies'
        ) {
          return {
            correct: false,
            reason: 'extra_plural_s',
            wordCount,
            numberCount,
            withinWordLimit: true,
            feedbackVi: `Thừa đuôi số nhiều (-s/-es). Đáp án đúng: "${item.candidate}".`,
          };
        }
      }
    }
  }

  // 4. Minor spelling error (strict in IELTS — still marked WRONG, with helpful diagnosis)
  for (const item of expanded) {
    const accCanon = canonicalizeIeltsExpression(item.candidate).canonical;
    // Skip pure numbers so "15" vs "50" isn't flagged as a spelling typo
    if (/^\d+$/.test(userCanon.canonical) || /^\d+$/.test(accCanon)) continue;

    const minLen = Math.min(userCanon.canonical.length, accCanon.length);
    const maxDist = minLen >= 7 ? 2 : minLen >= 4 ? 1 : 0;
    if (maxDist > 0) {
      const dist = levenshteinDistance(userCanon.canonical, accCanon);
      if (dist > 0 && dist <= maxDist) {
        return {
          correct: false,
          reason: 'minor_spelling_error',
          wordCount,
          numberCount,
          withinWordLimit: true,
          feedbackVi: `Sai chính tả nhẹ. IELTS yêu cầu đúng chính tả: "${item.candidate}".`,
        };
      }
    }
  }

  return {
    correct: false,
    reason: 'wrong_answer',
    wordCount,
    numberCount,
    withinWordLimit: true,
  };
}
