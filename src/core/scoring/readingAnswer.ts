import {
  scoreListeningAnswer,
  type WordLimitInput,
  type ListeningScoreReason,
} from './listeningAnswer';

export type ReadingScoreReason =
  | 'exact'
  | 'empty'
  | 'wrong_format_ynng'
  | 'wrong_format_tfng'
  | 'invalid_choice'
  | 'wrong_answer'
  | 'partial_match'
  | ListeningScoreReason;

export interface ReadingScoreResult {
  correct: boolean;
  reason: ReadingScoreReason;
  normalizedUser?: string;
  normalizedExpected?: string;
  matchedCount?: number;
  expectedCount?: number;
  feedbackVi?: string;
}

const TFNG_MAP: Record<string, 'TRUE' | 'FALSE' | 'NOT GIVEN'> = {
  t: 'TRUE',
  true: 'TRUE',
  f: 'FALSE',
  false: 'FALSE',
  ng: 'NOT GIVEN',
  'not given': 'NOT GIVEN',
  notgiven: 'NOT GIVEN',
};

const YNNG_MAP: Record<string, 'YES' | 'NO' | 'NOT GIVEN'> = {
  y: 'YES',
  yes: 'YES',
  n: 'NO',
  no: 'NO',
  ng: 'NOT GIVEN',
  'not given': 'NOT GIVEN',
  notgiven: 'NOT GIVEN',
};

function cleanChoice(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.)]+$/, '')
    .replace(/\s+/g, ' ');
}

/**
 * Score IELTS True / False / Not Given.
 * Explicitly rejects YES/NO inputs so learners do not confuse TFNG with YNNG.
 */
export function scoreTFNG(
  userAnswer: string,
  expectedKey: string,
): ReadingScoreResult {
  const cleaned = cleanChoice(userAnswer);
  const exp = TFNG_MAP[cleanChoice(expectedKey)];
  if (!cleaned) {
    return { correct: false, reason: 'empty', normalizedExpected: exp };
  }

  if (cleaned === 'y' || cleaned === 'yes' || cleaned === 'n' || cleaned === 'no') {
    return {
      correct: false,
      reason: 'wrong_format_ynng',
      normalizedUser: cleaned.toUpperCase(),
      normalizedExpected: exp,
      feedbackVi: 'Dạng bài này là TRUE / FALSE / NOT GIVEN, không dùng YES / NO.',
    };
  }

  const mapped = TFNG_MAP[cleaned];
  if (!mapped) {
    return {
      correct: false,
      reason: 'invalid_choice',
      normalizedUser: cleaned,
      normalizedExpected: exp,
    };
  }

  const correct = mapped === exp;
  return {
    correct,
    reason: correct ? 'exact' : 'wrong_answer',
    normalizedUser: mapped,
    normalizedExpected: exp,
  };
}

/**
 * Score IELTS Yes / No / Not Given.
 * Explicitly rejects TRUE/FALSE inputs so learners do not confuse YNNG with TFNG.
 */
export function scoreYNNG(
  userAnswer: string,
  expectedKey: string,
): ReadingScoreResult {
  const cleaned = cleanChoice(userAnswer);
  const exp = YNNG_MAP[cleanChoice(expectedKey)];
  if (!cleaned) {
    return { correct: false, reason: 'empty', normalizedExpected: exp };
  }

  if (cleaned === 't' || cleaned === 'true' || cleaned === 'f' || cleaned === 'false') {
    return {
      correct: false,
      reason: 'wrong_format_tfng',
      normalizedUser: cleaned.toUpperCase(),
      normalizedExpected: exp,
      feedbackVi: 'Dạng bài này là YES / NO / NOT GIVEN, không dùng TRUE / FALSE.',
    };
  }

  const mapped = YNNG_MAP[cleaned];
  if (!mapped) {
    return {
      correct: false,
      reason: 'invalid_choice',
      normalizedUser: cleaned,
      normalizedExpected: exp,
    };
  }

  const correct = mapped === exp;
  return {
    correct,
    reason: correct ? 'exact' : 'wrong_answer',
    normalizedUser: mapped,
    normalizedExpected: exp,
  };
}

/**
 * Score Matching Headings (Roman numerals i, ii, iii, iv... case-insensitive).
 */
export function scoreMatchingHeadings(
  userAnswer: string,
  expectedKey: string,
): ReadingScoreResult {
  const cleaned = cleanChoice(userAnswer);
  const exp = cleanChoice(expectedKey);
  if (!cleaned) {
    return { correct: false, reason: 'empty', normalizedExpected: exp };
  }
  const correct = cleaned === exp;
  return {
    correct,
    reason: correct ? 'exact' : 'wrong_answer',
    normalizedUser: cleaned,
    normalizedExpected: exp,
  };
}

/**
 * Score Single or Multi Multiple Choice Question.
 */
export function scoreMCQ(
  userAnswer: string | readonly string[],
  expectedKeys: string | readonly string[],
): ReadingScoreResult {
  const expArr: string[] = (typeof expectedKeys === 'string' ? [expectedKeys] : [...expectedKeys])
    .map((k) => cleanChoice(k).toUpperCase())
    .filter((k) => k.length > 0);
  const expSet = new Set(expArr);

  const rawUserArr: string[] =
    typeof userAnswer === 'string'
      ? userAnswer
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [...userAnswer];

  const userArr = rawUserArr
    .map((u) => cleanChoice(u).toUpperCase())
    .filter((u) => u.length > 0);

  if (userArr.length === 0) {
    return {
      correct: false,
      reason: 'empty',
      expectedCount: expSet.size,
      matchedCount: 0,
    };
  }

  const userSet = new Set(userArr);
  let matchedCount = 0;
  for (const k of userSet) {
    if (expSet.has(k)) matchedCount++;
  }

  const exact = matchedCount === expSet.size && userSet.size === expSet.size;
  if (exact) {
    return {
      correct: true,
      reason: 'exact',
      normalizedUser: Array.from(userSet).sort().join(','),
      normalizedExpected: Array.from(expSet).sort().join(','),
      matchedCount,
      expectedCount: expSet.size,
    };
  }

  return {
    correct: false,
    reason: expSet.size > 1 && matchedCount > 0 ? 'partial_match' : 'wrong_answer',
    normalizedUser: Array.from(userSet).sort().join(','),
    normalizedExpected: Array.from(expSet).sort().join(','),
    matchedCount,
    expectedCount: expSet.size,
  };
}

/**
 * Score Reading Gap-Fill / Completion / Short-Answer using official IELTS word-limit & spelling rules.
 */
export function scoreGapFill(
  userAnswer: string,
  acceptedAnswers: readonly string[],
  wordLimit?: WordLimitInput,
): ReadingScoreResult {
  const res = scoreListeningAnswer(userAnswer, acceptedAnswers, { wordLimit });
  return {
    correct: res.correct,
    reason: res.reason,
    normalizedUser: userAnswer.trim(),
    normalizedExpected: res.matchedAnswer ?? acceptedAnswers[0],
    feedbackVi: res.feedbackVi,
  };
}

export type ReadingQuestionScoringInput =
  | { type: 'tfng'; expectedKey: string }
  | { type: 'ynng'; expectedKey: string }
  | { type: 'headings'; expectedKey: string }
  | { type: 'mcq_single' | 'mcq_multi' | 'matching_info' | 'matching_features' | 'sentence_endings'; expectedKeys: string | readonly string[] }
  | { type: 'gap_fill'; accepted: readonly string[]; wordLimit?: WordLimitInput };

export function scoreReadingAnswer(
  question: ReadingQuestionScoringInput,
  userAnswer: string | readonly string[],
): ReadingScoreResult {
  switch (question.type) {
    case 'tfng':
      return scoreTFNG(String(userAnswer), question.expectedKey);
    case 'ynng':
      return scoreYNNG(String(userAnswer), question.expectedKey);
    case 'headings':
      return scoreMatchingHeadings(String(userAnswer), question.expectedKey);
    case 'mcq_single':
    case 'mcq_multi':
    case 'matching_info':
    case 'matching_features':
    case 'sentence_endings':
      return scoreMCQ(userAnswer, question.expectedKeys);
    case 'gap_fill':
      return scoreGapFill(String(userAnswer), question.accepted, question.wordLimit);
  }
}
