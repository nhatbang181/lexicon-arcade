import { Rating, type Grade } from 'ts-fsrs';
import type { ParaphraseItem } from '../../core/content/schemas';
import { computeCharIoU } from '../../core/scoring/evidence';
import { autoRate } from '../../core/srs/autoRate';
import {
  createNewCard,
  makeCardId,
  scheduleCard,
  type SRSCard,
} from '../../core/srs/fsrsAdapter';
import type { AttemptItem, ReviewRecord } from '../../core/storage/db';

// ---------------------------------------------------------------------------
// Constants & Difficulty Table (docs/games/V3-PARAPHRASE-RADAR.md §4 & §5)
// ---------------------------------------------------------------------------

export const V3_SESSION_LENGTH = 12;
export const V3_BASE_XP = 10;
export const V3_TARGET_PASS_IOU = 0.5;
export const V3_TARGET_PARTIAL_IOU = 0.2;
export const V3_DECOY_HIT_IOU = 0.35;

export interface V3DifficultyConfig {
  levelBand: '1-2' | '3-4' | '5-6' | '7-8' | '9-10';
  mix: readonly [number, number, number, number]; // L1 : L2 : L3 : L4
  timeLimitSec: number;
  maxDecoys: number;
}

export function getV3DifficultyConfig(level: number): V3DifficultyConfig {
  const lv = Math.max(1, Math.min(10, Math.round(level)));
  if (lv <= 2) {
    return { levelBand: '1-2', mix: [7, 3, 0, 0], timeLimitSec: 25, maxDecoys: 2 };
  }
  if (lv <= 4) {
    return { levelBand: '3-4', mix: [4, 4, 2, 0], timeLimitSec: 22, maxDecoys: 2 };
  }
  if (lv <= 6) {
    return { levelBand: '5-6', mix: [2, 3, 4, 1], timeLimitSec: 20, maxDecoys: 2 };
  }
  if (lv <= 8) {
    return { levelBand: '7-8', mix: [1, 3, 4, 2], timeLimitSec: 17, maxDecoys: 3 };
  }
  return { levelBand: '9-10', mix: [1, 2, 4, 3], timeLimitSec: 14, maxDecoys: 3 };
}

// ---------------------------------------------------------------------------
// Tokenizer & Chunking (docs/games/V3-PARAPHRASE-RADAR.md §4 & §11)
// ---------------------------------------------------------------------------

export interface ContextToken {
  index: number;
  text: string;
  start: number;
  end: number;
}

export interface CharSpan {
  start: number;
  end: number;
  text: string;
}

export interface ContextChunk extends CharSpan {
  index: number;
  kind: 'target' | 'decoy' | 'neutral';
  decoyIndex?: number;
}

/**
 * Tokenize a context string into word spans with exact character offsets [start, end).
 */
export function tokenizeContextWithSpans(context: string): ContextToken[] {
  const tokens: ContextToken[] = [];
  const regex = /[A-Za-z0-9]+(?:[-'’][A-Za-z0-9]+)*/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(context)) !== null) {
    tokens.push({
      index: index++,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return tokens;
}

function chunkNeutralSegment(
  context: string,
  segStart: number,
  segEnd: number,
): CharSpan[] {
  const slice = context.slice(segStart, segEnd);
  if (!slice.trim()) return [];

  // Split by strong clause punctuation while preserving offsets
  const clauseRegex = /[^.,;:!?—()]+/g;
  const chunks: CharSpan[] = [];
  let clauseMatch: RegExpExecArray | null;

  while ((clauseMatch = clauseRegex.exec(slice)) !== null) {
    const rawClause = clauseMatch[0];
    const clauseOffset = segStart + clauseMatch.index;
    const words = tokenizeContextWithSpans(rawClause);
    if (words.length === 0) continue;

    // Group into natural 3-word chunks (avoiding 1-word orphan tail)
    const chunkSize = 3;
    let i = 0;
    while (i < words.length) {
      const remaining = words.length - i;
      const take = remaining <= 4 ? remaining : chunkSize;
      const first = words[i];
      const last = words[i + take - 1];
      const start = clauseOffset + first.start;
      const end = clauseOffset + last.end;
      chunks.push({
        start,
        end,
        text: context.slice(start, end),
      });
      i += take;
    }
  }

  return chunks;
}

/**
 * Partition `item.context` into non-overlapping clickable chunks so that clicking
 * any word expands cleanly to a natural phrase chunk (including target & decoys).
 */
export function buildContextChunks(item: ParaphraseItem): ContextChunk[] {
  const anchors: Array<{
    start: number;
    end: number;
    text: string;
    kind: 'target' | 'decoy';
    decoyIndex?: number;
  }> = [
    {
      start: item.target.start,
      end: item.target.end,
      text: item.target.text,
      kind: 'target' as const,
    },
    ...item.decoys.map((d, idx) => ({
      start: d.start,
      end: d.end,
      text: d.text,
      kind: 'decoy' as const,
      decoyIndex: idx,
    })),
  ].sort((a, b) => a.start - b.start);

  const chunks: ContextChunk[] = [];
  let cursor = 0;

  for (const anchor of anchors) {
    if (anchor.start > cursor) {
      const neutrals = chunkNeutralSegment(item.context, cursor, anchor.start);
      for (const n of neutrals) {
        chunks.push({
          ...n,
          index: chunks.length,
          kind: 'neutral',
        });
      }
    }
    if (anchor.start >= cursor) {
      chunks.push({
        start: anchor.start,
        end: anchor.end,
        text: item.context.slice(anchor.start, anchor.end),
        index: chunks.length,
        kind: anchor.kind,
        decoyIndex: anchor.decoyIndex,
      });
      cursor = Math.max(cursor, anchor.end);
    }
  }

  if (cursor < item.context.length) {
    const tail = chunkNeutralSegment(item.context, cursor, item.context.length);
    for (const n of tail) {
      chunks.push({
        ...n,
        index: chunks.length,
        kind: 'neutral',
      });
    }
  }

  return chunks;
}

/**
 * Expand a single click at `charOffset` into its enclosing phrase chunk.
 */
export function expandClickToChunk(
  item: ParaphraseItem,
  charOffset: number,
): ContextChunk | null {
  const chunks = buildContextChunks(item);
  const direct = chunks.find((c) => charOffset >= c.start && charOffset < c.end);
  if (direct) return direct;

  // Allow clicking right on trailing boundary or space between adjacent words in a chunk
  const nearest = chunks.find((c) => charOffset >= c.start - 1 && charOffset <= c.end);
  return nearest ?? null;
}

/**
 * Snap an arbitrary drag range [rawStart, rawEnd) to clean word boundaries.
 */
export function snapSpanToWords(
  context: string,
  rawStart: number,
  rawEnd: number,
): CharSpan | null {
  const start = Math.max(0, Math.min(rawStart, rawEnd));
  const end = Math.min(context.length, Math.max(rawStart, rawEnd));
  if (end <= start) return null;

  const tokens = tokenizeContextWithSpans(context);
  const covered = tokens.filter((t) => t.end > start && t.start < end);
  if (covered.length === 0) return null;

  const snappedStart = covered[0].start;
  const snappedEnd = covered[covered.length - 1].end;
  return {
    start: snappedStart,
    end: snappedEnd,
    text: context.slice(snappedStart, snappedEnd),
  };
}

// ---------------------------------------------------------------------------
// Session Selection & Speed Multiplier (§4 & §5)
// ---------------------------------------------------------------------------

/**
 * Select `count` (default 12) items matching the L1:L2:L3:L4 ratio for `level`.
 * Gracefully fills remaining slots if a bucket has fewer items than requested.
 */
export function selectParaphraseSessionItems(
  allItems: readonly ParaphraseItem[],
  level: number,
  count = V3_SESSION_LENGTH,
): ParaphraseItem[] {
  if (allItems.length === 0 || count <= 0) return [];

  const config = getV3DifficultyConfig(level);
  const totalWeight = config.mix.reduce((sum, w) => sum + w, 0);

  // Compute integer quotas per level (1..4) summing to `count`
  const rawQuotas = config.mix.map((w) => (w / totalWeight) * count);
  const quotas = rawQuotas.map((q) => Math.floor(q));
  let remainder = count - quotas.reduce((s, q) => s + q, 0);
  const fractionalOrder = rawQuotas
    .map((q, idx) => ({ idx, frac: q - Math.floor(q) }))
    .sort((a, b) => b.frac - a.frac);
  for (const entry of fractionalOrder) {
    if (remainder <= 0) break;
    quotas[entry.idx] += 1;
    remainder -= 1;
  }

  const buckets: Record<1 | 2 | 3 | 4, ParaphraseItem[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };
  for (const item of allItems) {
    buckets[item.level].push(item);
  }

  const picked: ParaphraseItem[] = [];
  const usedIds = new Set<string>();

  for (let lvIdx = 0; lvIdx < 4; lvIdx++) {
    const lv = (lvIdx + 1) as 1 | 2 | 3 | 4;
    const needed = quotas[lvIdx];
    const pool = buckets[lv];
    for (let i = 0; i < needed && i < pool.length; i++) {
      picked.push(pool[i]);
      usedIds.add(pool[i].id);
    }
  }

  // Backfill from unused items if any bucket was short
  if (picked.length < count) {
    for (const item of allItems) {
      if (picked.length >= count) break;
      if (!usedIds.has(item.id)) {
        picked.push(item);
        usedIds.add(item.id);
      }
    }
  }

  // Interleave levels deterministically so L4 traps aren't all clustered at the end
  const byLevel: ParaphraseItem[][] = [[], [], [], []];
  for (const item of picked) {
    byLevel[item.level - 1].push(item);
  }
  const interleaved: ParaphraseItem[] = [];
  let added = true;
  while (added) {
    added = false;
    for (let b = 0; b < 4; b++) {
      const next = byLevel[b].shift();
      if (next) {
        interleaved.push(next);
        added = true;
      }
    }
  }

  return interleaved.slice(0, count);
}

/**
 * Compute XP speed multiplier (docs/games/V3-PARAPHRASE-RADAR.md §4):
 * - < 40% time used -> 1.5
 * - < 70% time used -> 1.2
 * - >= 70% time used -> 1.0
 */
export function computeSpeedMultiplier(
  elapsedMs: number,
  timeLimitSec: number,
): 1.5 | 1.2 | 1.0 {
  if (timeLimitSec <= 0) return 1.0;
  const ratio = Math.max(0, elapsedMs) / (timeLimitSec * 1000);
  if (ratio < 0.4) return 1.5;
  if (ratio < 0.7) return 1.2;
  return 1.0;
}

// ---------------------------------------------------------------------------
// Round Scoring (IoU, Decoy keyword_echo, L4 not_equivalent)
// ---------------------------------------------------------------------------

export type V3Outcome = 'correct' | 'partial' | 'decoy_hit' | 'wrong' | 'timeout';

export interface V3RoundInput {
  selectedSpan?: { start: number; end: number } | null;
  selectedNotInPassage?: boolean;
  timedOut?: boolean;
  elapsedMs: number;
}

export interface V3ScoreResult {
  correct: boolean;
  outcome: V3Outcome;
  iou: number;
  speedMultiplier: 1.5 | 1.2 | 1.0;
  xpEarned: number;
  matchedDecoyIndex?: number;
  matchedDecoyText?: string;
  decoyWhyVi?: string;
  trapType?: 'keyword_echo';
  tooWideWarning?: string;
  headlineVi: string;
  explanationVi: string;
}

export function scoreParaphraseSelection(
  item: ParaphraseItem,
  input: V3RoundInput,
  timeLimitSec: number,
): V3ScoreResult {
  const speedMultiplier = computeSpeedMultiplier(input.elapsedMs, timeLimitSec);

  // 1. Timeout
  if (input.timedOut) {
    return {
      correct: false,
      outcome: 'timeout',
      iou: 0,
      speedMultiplier: 1.0,
      xpEarned: 0,
      headlineVi: 'Hết giờ quét radar!',
      explanationVi:
        item.relation === 'not_equivalent'
          ? `Đáp án đúng là KHÔNG CÓ TRONG ĐOẠN (phím N). ${item.explanationVi}`
          : `Cụm tương đương là “${item.target.text}”. ${item.explanationVi}`,
    };
  }

  // 2. Level 4: not_equivalent
  if (item.relation === 'not_equivalent') {
    if (input.selectedNotInPassage) {
      return {
        correct: true,
        outcome: 'correct',
        iou: 1,
        speedMultiplier,
        xpEarned: Math.round(V3_BASE_XP * speedMultiplier),
        headlineVi: `✓ Chính xác! Không có ý tương đương trong đoạn (L4 · x${speedMultiplier})`,
        explanationVi: item.explanationVi,
      };
    }

    // User selected a span on a not_equivalent item -> check if they fell for a decoy
    if (input.selectedSpan) {
      let bestDecoyIdx = -1;
      let bestDecoyIoU = 0;
      for (let i = 0; i < item.decoys.length; i++) {
        const dIoU = computeCharIoU(input.selectedSpan, item.decoys[i]);
        if (dIoU > bestDecoyIoU) {
          bestDecoyIoU = dIoU;
          bestDecoyIdx = i;
        }
      }

      if (bestDecoyIdx !== -1 && bestDecoyIoU >= V3_DECOY_HIT_IOU) {
        const decoy = item.decoys[bestDecoyIdx];
        return {
          correct: false,
          outcome: 'decoy_hit',
          iou: 0,
          speedMultiplier: 1.0,
          xpEarned: 0,
          matchedDecoyIndex: bestDecoyIdx,
          matchedDecoyText: decoy.text,
          decoyWhyVi: decoy.whyVi,
          trapType: 'keyword_echo',
          headlineVi: `✗ “${decoy.text}” là bẫy keyword_echo!`,
          explanationVi: `${decoy.whyVi} — ${item.explanationVi}`,
        };
      }
    }

    return {
      correct: false,
      outcome: 'wrong',
      iou: 0,
      speedMultiplier: 1.0,
      xpEarned: 0,
      headlineVi: '✗ Chưa đúng — Đáp án là KHÔNG CÓ TRONG ĐOẠN (N)',
      explanationVi: item.explanationVi,
    };
  }

  // 3. Equivalent item, but user pressed "KHÔNG CÓ TRONG ĐOẠN"
  if (input.selectedNotInPassage || !input.selectedSpan) {
    return {
      correct: false,
      outcome: 'wrong',
      iou: 0,
      speedMultiplier: 1.0,
      xpEarned: 0,
      headlineVi: `✗ Có ý tương đương trong đoạn: “${item.target.text}”`,
      explanationVi: item.explanationVi,
    };
  }

  const targetIoU = computeCharIoU(input.selectedSpan, item.target);
  const selectedLen = Math.max(0, input.selectedSpan.end - input.selectedSpan.start);
  const targetLen = Math.max(1, item.target.end - item.target.start);
  const isTooWide = selectedLen > targetLen * 1.8;

  // Check decoy hit
  let bestDecoyIdx = -1;
  let bestDecoyIoU = 0;
  for (let i = 0; i < item.decoys.length; i++) {
    const dIoU = computeCharIoU(input.selectedSpan, item.decoys[i]);
    if (dIoU > bestDecoyIoU) {
      bestDecoyIoU = dIoU;
      bestDecoyIdx = i;
    }
  }

  // Exact/Strong target match: IoU >= 0.5
  if (targetIoU >= V3_TARGET_PASS_IOU) {
    return {
      correct: true,
      outcome: 'correct',
      iou: targetIoU,
      speedMultiplier,
      xpEarned: Math.round(V3_BASE_XP * speedMultiplier),
      headlineVi: `✓ “${item.questionPhrase}” ↔ “${item.target.text}” (L${item.level})`,
      explanationVi: item.explanationVi,
    };
  }

  // Decoy hit (keyword_echo)
  if (bestDecoyIdx !== -1 && bestDecoyIoU >= V3_DECOY_HIT_IOU && bestDecoyIoU > targetIoU) {
    const decoy = item.decoys[bestDecoyIdx];
    return {
      correct: false,
      outcome: 'decoy_hit',
      iou: targetIoU,
      speedMultiplier: 1.0,
      xpEarned: 0,
      matchedDecoyIndex: bestDecoyIdx,
      matchedDecoyText: decoy.text,
      decoyWhyVi: decoy.whyVi,
      trapType: 'keyword_echo',
      headlineVi: `✗ “${decoy.text}” → bẫy keyword_echo`,
      explanationVi: `${decoy.whyVi} Đáp án đúng: “${item.target.text}”.`,
    };
  }

  // Partial match: 0.2 <= IoU < 0.5 -> Hard, 1/2 XP
  if (targetIoU >= V3_TARGET_PARTIAL_IOU) {
    const halfXp = Math.round((V3_BASE_XP / 2) * speedMultiplier);
    const tooWideWarning = isTooWide ? 'Chọn đúng cụm, không chọn cả câu.' : undefined;
    return {
      correct: true,
      outcome: 'partial',
      iou: targetIoU,
      speedMultiplier,
      xpEarned: halfXp,
      tooWideWarning,
      headlineVi: `Gần đúng (IoU ${Math.round(targetIoU * 100)}%, +${halfXp} XP)`,
      explanationVi: tooWideWarning
        ? `${tooWideWarning} Cụm chuẩn: “${item.target.text}”. ${item.explanationVi}`
        : `Cụm chuẩn: “${item.target.text}”. ${item.explanationVi}`,
    };
  }

  // Wrong selection
  const tooWideWarning = isTooWide ? 'Chọn đúng cụm, không chọn cả câu.' : undefined;
  return {
    correct: false,
    outcome: 'wrong',
    iou: targetIoU,
    speedMultiplier: 1.0,
    xpEarned: 0,
    tooWideWarning,
    headlineVi: `✗ Chưa trúng mục tiêu — Đáp án: “${item.target.text}”`,
    explanationVi: tooWideWarning
      ? `${tooWideWarning} ${item.explanationVi}`
      : item.explanationVi,
  };
}

// ---------------------------------------------------------------------------
// Session State Machine (Pure, 0 React / DOM)
// ---------------------------------------------------------------------------

export interface V3MistakeRecord {
  id: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  note?: string;
}

export type V3EngineEvent =
  | {
      type: 'round_scored';
      itemId: string;
      outcome: V3Outcome;
      correct: boolean;
      xpEarned: number;
      cardId: string;
      rating: Grade;
      trapType?: 'keyword_echo';
    }
  | { type: 'session_completed'; totalXp: number; avgResponseSec: number };

export interface V3EngineState {
  mode: 'training' | 'sprint';
  level: number;
  stage: 'playing' | 'recap';
  startedAt: number;
  endedAt?: number;
  config: V3DifficultyConfig;
  items: ParaphraseItem[];
  currentIndex: number;
  selectedSpan: CharSpan | null;
  answered: boolean;
  lastResult: V3ScoreResult | null;
  // Metrics & gamification
  xp: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  partialCount: number;
  totalDecoyRounds: number;
  decoysAvoided: number;
  keywordEchoHits: number;
  shouldLogKeywordEchoTag: boolean;
  responseTimesMs: number[];
  previousAvgSec: number | null;
  // Persistence payloads
  mistakes: V3MistakeRecord[];
  attemptItems: AttemptItem[];
  srsCards: Record<string, SRSCard>;
  reviews: Array<Omit<ReviewRecord, 'id'>>;
}

export interface CreateV3SessionOptions {
  mode?: 'training' | 'sprint';
  level?: number;
  allItems: readonly ParaphraseItem[];
  existingCards?: readonly SRSCard[];
  previousAvgSec?: number | null;
  count?: number;
  nowMs?: number;
}

export function createV3Session(options: CreateV3SessionOptions): V3EngineState {
  const {
    mode = 'training',
    level = 1,
    allItems,
    existingCards = [],
    previousAvgSec = null,
    count = V3_SESSION_LENGTH,
    nowMs = Date.now(),
  } = options;

  const config = getV3DifficultyConfig(level);
  const items = selectParaphraseSessionItems(allItems, level, count);
  const srsCards: Record<string, SRSCard> = {};
  for (const c of existingCards) {
    srsCards[c.id] = { ...c };
  }

  return {
    mode,
    level,
    stage: items.length > 0 ? 'playing' : 'recap',
    startedAt: nowMs,
    config,
    items,
    currentIndex: 0,
    selectedSpan: null,
    answered: false,
    lastResult: null,
    xp: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    partialCount: 0,
    totalDecoyRounds: items.filter((it) => it.decoys.length > 0).length,
    decoysAvoided: 0,
    keywordEchoHits: 0,
    shouldLogKeywordEchoTag: false,
    responseTimesMs: [],
    previousAvgSec,
    mistakes: [],
    attemptItems: [],
    srsCards,
    reviews: [],
  };
}

export function setV3Selection(
  state: V3EngineState,
  span: CharSpan | null,
): V3EngineState {
  if (state.stage !== 'playing' || state.answered) return state;
  // Clicking the exact same span toggles it off (§4: "Bấm lại để bỏ chọn")
  if (
    span &&
    state.selectedSpan &&
    state.selectedSpan.start === span.start &&
    state.selectedSpan.end === span.end
  ) {
    return { ...state, selectedSpan: null };
  }
  return { ...state, selectedSpan: span };
}

export function clearV3Selection(state: V3EngineState): V3EngineState {
  if (state.stage !== 'playing' || state.answered) return state;
  return { ...state, selectedSpan: null };
}

export function submitV3Round(
  state: V3EngineState,
  input: Omit<V3RoundInput, 'selectedSpan'> & { selectedSpan?: CharSpan | null },
  nowMs = Date.now(),
): { state: V3EngineState; events: V3EngineEvent[] } {
  if (state.stage !== 'playing' || state.answered) {
    return { state, events: [] };
  }

  const item = state.items[state.currentIndex];
  if (!item) return { state, events: [] };

  const activeSpan =
    input.selectedSpan !== undefined ? input.selectedSpan : state.selectedSpan;

  const scoreRes = scoreParaphraseSelection(
    item,
    {
      selectedSpan: activeSpan,
      selectedNotInPassage: input.selectedNotInPassage,
      timedOut: input.timedOut,
      elapsedMs: input.elapsedMs,
    },
    state.config.timeLimitSec,
  );

  // SRS update for para:*#para_match (§8)
  const cardId = makeCardId(item.id, 'para_match');
  const existingCard = state.srsCards[cardId];
  const baseCard =
    existingCard ??
    createNewCard(item.id, 'para_match', {
      now: new Date(nowMs),
      unlocked: true,
      source: 'curriculum',
    });

  let rating: Grade;
  if (scoreRes.outcome === 'partial') {
    rating = Rating.Hard;
  } else if (!scoreRes.correct) {
    rating = Rating.Again;
  } else {
    rating = autoRate({
      correct: true,
      face: 'para_match',
      responseTimeMs: input.elapsedMs,
      cardStreak: existingCard?.streak ?? 0,
    });
  }

  const scheduled = scheduleCard(baseCard, rating, new Date(nowMs));
  const nextCards: Record<string, SRSCard> = {
    ...state.srsCards,
    [cardId]: scheduled.card,
  };
  const nextReviews: Array<Omit<ReviewRecord, 'id'>> = [
    ...state.reviews,
    {
      cardId,
      rating,
      correct: scoreRes.correct,
      hintUsed: false,
      durationMs: input.elapsedMs,
      ts: nowMs,
      gameId: 'v3',
      prevState: scheduled.prevState,
    },
  ];

  const nextCombo = scoreRes.correct ? state.combo + 1 : 0;
  const nextMaxCombo = Math.max(state.maxCombo, nextCombo);
  const isDecoyRound = item.decoys.length > 0;
  const avoidedDecoy = isDecoyRound && scoreRes.outcome !== 'decoy_hit';
  const nextKeywordEchoHits =
    state.keywordEchoHits + (scoreRes.outcome === 'decoy_hit' ? 1 : 0);

  const nextMistakes = [...state.mistakes];
  if (!scoreRes.correct) {
    const userLabel = input.timedOut
      ? '(Hết giờ)'
      : input.selectedNotInPassage
      ? 'KHÔNG CÓ TRONG ĐOẠN'
      : activeSpan?.text ?? '(Không chọn)';
    nextMistakes.push({
      id: `${item.id}_${state.currentIndex}`,
      prompt: `« ${item.questionPhrase} »`,
      userAnswer: userLabel,
      correctAnswer:
        item.relation === 'not_equivalent'
          ? 'KHÔNG CÓ TRONG ĐOẠN (N)'
          : item.target.text,
      note: scoreRes.decoyWhyVi ?? item.explanationVi,
    });
  }

  const nextAttemptItems: AttemptItem[] = [
    ...state.attemptItems,
    {
      itemId: item.id,
      correct: scoreRes.correct,
      responseTimeMs: input.elapsedMs,
      trapType: scoreRes.trapType,
    },
  ];

  const nextState: V3EngineState = {
    ...state,
    selectedSpan: activeSpan ?? null,
    answered: true,
    lastResult: scoreRes,
    xp: state.xp + scoreRes.xpEarned,
    combo: nextCombo,
    maxCombo: nextMaxCombo,
    correctCount: state.correctCount + (scoreRes.correct ? 1 : 0),
    partialCount: state.partialCount + (scoreRes.outcome === 'partial' ? 1 : 0),
    decoysAvoided: state.decoysAvoided + (avoidedDecoy ? 1 : 0),
    keywordEchoHits: nextKeywordEchoHits,
    shouldLogKeywordEchoTag: nextKeywordEchoHits >= 2,
    responseTimesMs: [...state.responseTimesMs, input.elapsedMs],
    mistakes: nextMistakes,
    attemptItems: nextAttemptItems,
    srsCards: nextCards,
    reviews: nextReviews,
  };

  return {
    state: nextState,
    events: [
      {
        type: 'round_scored',
        itemId: item.id,
        outcome: scoreRes.outcome,
        correct: scoreRes.correct,
        xpEarned: scoreRes.xpEarned,
        cardId,
        rating,
        trapType: scoreRes.trapType,
      },
    ],
  };
}

export function nextV3Round(
  state: V3EngineState,
  nowMs = Date.now(),
): { state: V3EngineState; events: V3EngineEvent[] } {
  if (state.stage !== 'playing' || !state.answered) {
    return { state, events: [] };
  }

  const nextIndex = state.currentIndex + 1;
  if (nextIndex < state.items.length) {
    return {
      state: {
        ...state,
        currentIndex: nextIndex,
        selectedSpan: null,
        answered: false,
        lastResult: null,
      },
      events: [],
    };
  }

  const avgSec = computeAvgResponseSec(state.responseTimesMs);
  return {
    state: {
      ...state,
      stage: 'recap',
      endedAt: nowMs,
      selectedSpan: null,
      lastResult: null,
    },
    events: [
      {
        type: 'session_completed',
        totalXp: state.xp,
        avgResponseSec: avgSec,
      },
    ],
  };
}

export function computeAvgResponseSec(responseTimesMs: readonly number[]): number {
  if (responseTimesMs.length === 0) return 0;
  const totalMs = responseTimesMs.reduce((sum, ms) => sum + ms, 0);
  return Number((totalMs / responseTimesMs.length / 1000).toFixed(1));
}

export function formatV3WinStatement(state: V3EngineState): string {
  const avgSec = computeAvgResponseSec(state.responseTimesMs);
  const prevPart =
    state.previousAvgSec !== null ? ` (lần trước ${state.previousAvgSec.toFixed(1)}s)` : '';
  return `Bạn né được ${state.decoysAvoided}/${state.totalDecoyRounds} decoy keyword_echo. Thời gian trung bình ${avgSec.toFixed(1)}s${prevPart}.`;
}
