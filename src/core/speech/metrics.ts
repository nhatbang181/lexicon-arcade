/**
 * Pure IELTS Speaking fluency, lexical diversity, filler, pause, and indirect pronunciation metrics.
 * ZERO React imports, ZERO DOM access, ZERO AI API calls.
 *
 * Aligns with docs/games/S1-MOCK-EXAMINER.md §4.1, src/core/grading/packet.ts (SpeakingMetricsInput),
 * and src/core/storage/db.ts (RecordingRecord['metrics']).
 */

import { tokenizeWords } from '../text/tokenize';
import type { SpeakingMetricsInput } from '../grading/packet';
import type { RecordingRecord } from '../storage/db';
import type { AsrTranscriptSegment } from './asr';
import type { VadSummary } from './vad';

export const MULTI_WORD_FILLERS = [
  'you know',
  'kind of',
  'sort of',
  'i mean',
] as const;

export const SINGLE_WORD_FILLERS = [
  'um',
  'umm',
  'uh',
  'uhh',
  'er',
  'erm',
  'ah',
  'hmm',
  'like',
  'basically',
  'actually',
  'literally',
] as const;

export const PRONUNCIATION_PROXY_DISCLAIMER_VI =
  'Ước tính gián tiếp dựa trên độ tin cậy nhận dạng giọng nói (ASR) của trình duyệt — không gọi API AI và không thay thế đánh giá phát âm chuyên môn.';

export const BAND8_SPEAKING_BENCHMARKS = {
  wpmMin: 130,
  wpmMax: 170,
  maxLongPausesPerMin: 1,
  maxMidPausesPerMin: 4,
  minMeanRunLength: 8,
  maxStartLatencySec: 1.5,
  maxFillersPerMin: 4,
  minPart2DurationSec: 100, // 1:40
  minMattr: 0.55,
} as const;

export interface FillerEntry {
  phrase: string;
  count: number;
  /** Token start indices where this filler occurred. */
  indices: number[];
}

export interface FillerAnalysis {
  fillerCount: number;
  fillersPerMin: number;
  fillerList: FillerEntry[];
  /** Note reminding learners that browser ASR frequently omits vocalized fillers like "um/uh". */
  reliabilityNoteVi: string;
}

export interface LexicalDiversityMetrics {
  wordCount: number;
  uniqueWordCount: number;
  /** Classic Type-Token Ratio (unique / total) in [0, 1]. */
  ttr: number;
  /** Moving-Average Type-Token Ratio (default window 100 words, per S1 §4.1) in [0, 1]. */
  mattr: number;
  mattrWindow: number;
  /** Guiraud's Index (unique / sqrt(total)), length-compensated lexical richness. */
  guiraud: number;
}

export interface PauseMetrics {
  /** Internal pauses >= 0.5s. */
  pauseCount: number;
  /** Internal pauses in [1.0s, 2.0s]. */
  midPauseCount: number;
  /** Internal pauses > 2.0s. */
  longPauseCount: number;
  /** Total internal pauses >= 1.0s (mid + long). */
  pausesOver1s: number;
  midPausesPerMin: number;
  longPausesPerMin: number;
  longestPauseSec: number;
  /** Average words spoken between pauses >= 0.5s (S1 §4.1). */
  meanRunLength: number;
  speechDurationSec: number;
  silenceDurationSec: number;
  silenceRatio: number;
  startLatencySec: number | null;
}

export interface LowConfidenceWord {
  word: string;
  confidence: number;
  context?: string;
}

export type PronunciationProxyLevel = 'high' | 'moderate' | 'low' | 'unavailable';

export interface PronunciationProxyMetrics {
  /** Always true: this metric is an indirect signal from browser ASR confidence, never acoustic scoring. */
  isIndirectEstimate: true;
  disclaimerVi: string;
  averageConfidence: number | null;
  /** Average confidence expressed as 0-100 percentage, or null if unavailable. */
  estimatedClarityPct: number | null;
  scoredSegmentCount: number;
  lowConfidenceCount: number;
  lowConfidenceWords: LowConfidenceWord[];
  level: PronunciationProxyLevel;
}

export interface SpeechMetrics {
  wordCount: number;
  /** Effective duration (seconds) used for per-minute rates (excludes leading & trailing silence when VAD is present). */
  effectiveDurationSec: number;
  /** Words per minute over active speaking time. */
  wpm: number;
  fillerCount: number;
  fillersPerMin: number;
  fillerList: FillerEntry[];
  fillerReliabilityNoteVi: string;
  lexicalDiversity: LexicalDiversityMetrics;
  pauseMetrics: PauseMetrics;
  pronunciationProxy: PronunciationProxyMetrics;
}

export interface ComputeSpeechMetricsInput {
  transcript: string;
  /** Fallback duration in seconds if VAD summary is absent or has 0 active duration. */
  durationSec?: number;
  /** Optional VAD timeline summary for accurate pauses, start latency, and active speaking span. */
  vadSummary?: VadSummary | null;
  /** Optional explicit internal pause durations (seconds) when computing without full VadSummary. */
  pauseDurationsSec?: number[];
  /** Optional start latency override (seconds). */
  startLatencySec?: number | null;
  /** Optional finalized ASR segments carrying confidence scores for indirect pronunciation proxy. */
  asrSegments?: ReadonlyArray<Pick<AsrTranscriptSegment, 'text' | 'confidence'>>;
  /** Window size for MATTR calculation. Default: 100 (docs/games/S1 §4.1). */
  mattrWindow?: number;
  /** Confidence threshold for flagging low-confidence segments/words. Default: 0.75. */
  lowConfidenceThreshold?: number;
}

export type BenchmarkStatus = 'target' | 'near' | 'below' | 'unavailable';

export interface Band8Comparison {
  wpm: BenchmarkStatus;
  longPausesPerMin: BenchmarkStatus;
  midPausesPerMin: BenchmarkStatus;
  meanRunLength: BenchmarkStatus;
  startLatencySec: BenchmarkStatus;
  fillersPerMin: BenchmarkStatus;
  mattr: BenchmarkStatus;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function tokenizeSpeechWords(transcript: string): string[] {
  return tokenizeWords(transcript, { splitHyphens: false }).filter((tok) =>
    /[a-z0-9]/i.test(tok),
  );
}

/**
 * Detect single- and multi-word fillers cleanly on word-token boundaries
 * (so "umbrella" never matches "um" and "likely" never matches "like").
 */
export function detectFillers(
  transcript: string,
  durationSec = 0,
): FillerAnalysis {
  const tokens = tokenizeSpeechWords(transcript);
  const multiParsed = MULTI_WORD_FILLERS.map((phrase) => ({
    phrase,
    parts: phrase.split(' '),
  }));
  const singleSet = new Set<string>(SINGLE_WORD_FILLERS);

  const map = new Map<string, number[]>();
  const record = (phrase: string, index: number) => {
    const existing = map.get(phrase);
    if (existing) {
      existing.push(index);
    } else {
      map.set(phrase, [index]);
    }
  };

  let i = 0;
  while (i < tokens.length) {
    let matchedMulti = false;
    for (const candidate of multiParsed) {
      const len = candidate.parts.length;
      if (i + len <= tokens.length) {
        let eq = true;
        for (let k = 0; k < len; k++) {
          if (tokens[i + k] !== candidate.parts[k]) {
            eq = false;
            break;
          }
        }
        if (eq) {
          record(candidate.phrase, i);
          i += len;
          matchedMulti = true;
          break;
        }
      }
    }
    if (matchedMulti) continue;

    const tok = tokens[i];
    if (singleSet.has(tok)) {
      record(tok, i);
    }
    i++;
  }

  const fillerList: FillerEntry[] = Array.from(map.entries())
    .map(([phrase, indices]) => ({
      phrase,
      count: indices.length,
      indices,
    }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));

  const fillerCount = fillerList.reduce((acc, item) => acc + item.count, 0);
  const fillersPerMin =
    durationSec > 0 && fillerCount > 0 ? round((fillerCount / durationSec) * 60, 2) : 0;

  return {
    fillerCount,
    fillersPerMin,
    fillerList,
    reliabilityNoteVi:
      'Lưu ý: ASR trình duyệt thường tự lọc bớt các tiếng ngập ngừng như "um/uh", nên số filler thực tế có thể cao hơn.',
  };
}

/**
 * Compute lexical diversity: TTR, MATTR (Moving-Average Type-Token Ratio, default window 100),
 * and Guiraud's Index (unique / sqrt(total)).
 */
export function computeLexicalDiversity(
  transcript: string,
  mattrWindow = 100,
): LexicalDiversityMetrics {
  const tokens = tokenizeSpeechWords(transcript);
  const wordCount = tokens.length;
  const safeWindow = Math.max(1, Math.floor(mattrWindow));

  if (wordCount === 0) {
    return {
      wordCount: 0,
      uniqueWordCount: 0,
      ttr: 0,
      mattr: 0,
      mattrWindow: safeWindow,
      guiraud: 0,
    };
  }

  const uniqueSet = new Set(tokens);
  const uniqueWordCount = uniqueSet.size;
  const ttr = uniqueWordCount / wordCount;
  const guiraud = uniqueWordCount / Math.sqrt(wordCount);

  let mattr: number;
  if (wordCount <= safeWindow) {
    mattr = ttr;
  } else {
    // O(N) sliding window frequency counter
    const freq = new Map<string, number>();
    let distinct = 0;
    for (let i = 0; i < safeWindow; i++) {
      const tok = tokens[i];
      const prev = freq.get(tok) ?? 0;
      if (prev === 0) distinct++;
      freq.set(tok, prev + 1);
    }

    let sumWindowTtr = distinct / safeWindow;
    const windowCount = wordCount - safeWindow + 1;

    for (let right = safeWindow; right < wordCount; right++) {
      const leaving = tokens[right - safeWindow];
      const leavingCount = (freq.get(leaving) ?? 1) - 1;
      if (leavingCount <= 0) {
        freq.delete(leaving);
        distinct--;
      } else {
        freq.set(leaving, leavingCount);
      }

      const entering = tokens[right];
      const enteringPrev = freq.get(entering) ?? 0;
      if (enteringPrev === 0) distinct++;
      freq.set(entering, enteringPrev + 1);

      sumWindowTtr += distinct / safeWindow;
    }

    mattr = sumWindowTtr / windowCount;
  }

  return {
    wordCount,
    uniqueWordCount,
    ttr: round(ttr, 3),
    mattr: round(mattr, 3),
    mattrWindow: safeWindow,
    guiraud: round(guiraud, 2),
  };
}

/**
 * Compute indirect pronunciation proxy from browser ASR segment confidence scores.
 * Pure, offline, zero AI APIs. Always clearly marked as an indirect estimate.
 */
export function computePronunciationProxy(
  asrSegments?: ReadonlyArray<Pick<AsrTranscriptSegment, 'text' | 'confidence'>>,
  lowConfidenceThreshold = 0.75,
): PronunciationProxyMetrics {
  const scored = (asrSegments ?? []).filter(
    (seg): seg is { text: string; confidence: number } =>
      typeof seg.confidence === 'number' &&
      Number.isFinite(seg.confidence) &&
      seg.confidence > 0,
  );

  if (scored.length === 0) {
    return {
      isIndirectEstimate: true,
      disclaimerVi: PRONUNCIATION_PROXY_DISCLAIMER_VI,
      averageConfidence: null,
      estimatedClarityPct: null,
      scoredSegmentCount: 0,
      lowConfidenceCount: 0,
      lowConfidenceWords: [],
      level: 'unavailable',
    };
  }

  const sum = scored.reduce((acc, s) => acc + Math.min(1, Math.max(0, s.confidence)), 0);
  const averageConfidence = round(sum / scored.length, 3);
  const estimatedClarityPct = Math.round(averageConfidence * 100);

  const lowSegments = scored.filter((s) => s.confidence < lowConfidenceThreshold);
  const lowWordMap = new Map<string, LowConfidenceWord>();

  for (const seg of lowSegments) {
    const words = tokenizeSpeechWords(seg.text);
    // Prefer content words (length >= 3) when extracting candidate words from a low-confidence chunk
    const candidates = words.filter((w) => w.length >= 3);
    const chosen = candidates.length > 0 ? candidates : words;
    for (const word of chosen) {
      const existing = lowWordMap.get(word);
      if (!existing || seg.confidence < existing.confidence) {
        lowWordMap.set(word, {
          word,
          confidence: round(seg.confidence, 2),
          context: seg.text.trim().slice(0, 80),
        });
      }
      if (lowWordMap.size >= 20) break;
    }
    if (lowWordMap.size >= 20) break;
  }

  const lowConfidenceWords = Array.from(lowWordMap.values()).sort(
    (a, b) => a.confidence - b.confidence,
  );

  let level: PronunciationProxyLevel;
  if (averageConfidence >= 0.88) {
    level = 'high';
  } else if (averageConfidence >= lowConfidenceThreshold) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  return {
    isIndirectEstimate: true,
    disclaimerVi: PRONUNCIATION_PROXY_DISCLAIMER_VI,
    averageConfidence,
    estimatedClarityPct,
    scoredSegmentCount: scored.length,
    lowConfidenceCount: lowSegments.length,
    lowConfidenceWords,
    level,
  };
}

/**
 * Compute complete speech metrics from transcript + optional VAD summary + optional ASR confidence segments.
 */
export function computeSpeechMetrics(input: ComputeSpeechMetricsInput): SpeechMetrics {
  const {
    transcript,
    durationSec = 0,
    vadSummary,
    pauseDurationsSec,
    startLatencySec,
    asrSegments,
    mattrWindow = 100,
    lowConfidenceThreshold = 0.75,
  } = input;

  const lexicalDiversity = computeLexicalDiversity(transcript, mattrWindow);
  const wordCount = lexicalDiversity.wordCount;

  // Determine effective speaking duration (S1 §4.1 excludes leading & trailing silence when VAD is available)
  let effectiveDurationSec = 0;
  if (vadSummary && vadSummary.activeDurationSec > 0) {
    effectiveDurationSec = vadSummary.activeDurationSec;
  } else if (durationSec > 0 && Number.isFinite(durationSec)) {
    effectiveDurationSec = durationSec;
  } else if (vadSummary && vadSummary.totalDurationSec > 0) {
    effectiveDurationSec = vadSummary.totalDurationSec;
  }

  const wpm =
    effectiveDurationSec > 0 && wordCount > 0
      ? round((wordCount / effectiveDurationSec) * 60, 1)
      : 0;

  const fillerAnalysis = detectFillers(transcript, effectiveDurationSec);

  // Pause metrics from VAD summary or explicit pauseDurationsSec
  let pauseCount = 0;
  let midPauseCount = 0;
  let longPauseCount = 0;
  let longestPauseSec = 0;
  let speechDurationSec = effectiveDurationSec;
  let silenceDurationSec = 0;
  let silenceRatio = 0;
  let resolvedStartLatency: number | null =
    startLatencySec !== undefined ? startLatencySec : null;

  if (vadSummary) {
    pauseCount = vadSummary.pauseCount;
    midPauseCount = vadSummary.midPauseCount;
    longPauseCount = vadSummary.longPauseCount;
    longestPauseSec = vadSummary.longestPauseSec;
    speechDurationSec = vadSummary.speechDurationSec;
    silenceDurationSec = vadSummary.silenceDurationSec;
    silenceRatio = vadSummary.silenceRatio;
    if (resolvedStartLatency === null) {
      resolvedStartLatency = vadSummary.startLatencySec;
    }
  } else if (pauseDurationsSec && pauseDurationsSec.length > 0) {
    for (const p of pauseDurationsSec) {
      if (!Number.isFinite(p) || p <= 0) continue;
      if (p > longestPauseSec) longestPauseSec = p;
      if (p >= 0.5) pauseCount++;
      if (p > 2.0) longPauseCount++;
      else if (p >= 1.0) midPauseCount++;
    }
    const totalPauseSec = pauseDurationsSec.reduce((a, b) => a + Math.max(0, b), 0);
    silenceDurationSec = round(totalPauseSec, 3);
    speechDurationSec = round(Math.max(0, effectiveDurationSec - totalPauseSec), 3);
    silenceRatio =
      effectiveDurationSec > 0
        ? round(Math.min(1, totalPauseSec / effectiveDurationSec), 3)
        : 0;
    longestPauseSec = round(longestPauseSec, 3);
  }

  const pausesOver1s = midPauseCount + longPauseCount;
  const minutes = effectiveDurationSec / 60;
  const midPausesPerMin = minutes > 0 ? round(midPauseCount / minutes, 2) : 0;
  const longPausesPerMin = minutes > 0 ? round(longPauseCount / minutes, 2) : 0;
  const meanRunLength = wordCount > 0 ? round(wordCount / (pauseCount + 1), 1) : 0;

  const pauseMetrics: PauseMetrics = {
    pauseCount,
    midPauseCount,
    longPauseCount,
    pausesOver1s,
    midPausesPerMin,
    longPausesPerMin,
    longestPauseSec,
    meanRunLength,
    speechDurationSec: round(speechDurationSec, 3),
    silenceDurationSec: round(silenceDurationSec, 3),
    silenceRatio,
    startLatencySec: resolvedStartLatency,
  };

  const pronunciationProxy = computePronunciationProxy(asrSegments, lowConfidenceThreshold);

  return {
    wordCount,
    effectiveDurationSec: round(effectiveDurationSec, 3),
    wpm,
    fillerCount: fillerAnalysis.fillerCount,
    fillersPerMin: fillerAnalysis.fillersPerMin,
    fillerList: fillerAnalysis.fillerList,
    fillerReliabilityNoteVi: fillerAnalysis.reliabilityNoteVi,
    lexicalDiversity,
    pauseMetrics,
    pronunciationProxy,
  };
}

/**
 * Evaluate computed speech metrics against Band 8 reference guidelines (S1 §4.1).
 * For guidance only — never mechanical grading.
 */
export function evaluateMetricsAgainstBand8(metrics: SpeechMetrics): Band8Comparison {
  const b = BAND8_SPEAKING_BENCHMARKS;

  const wpm: BenchmarkStatus =
    metrics.wpm <= 0
      ? 'unavailable'
      : metrics.wpm >= b.wpmMin && metrics.wpm <= b.wpmMax
        ? 'target'
        : metrics.wpm >= 110 && metrics.wpm <= 190
          ? 'near'
          : 'below';

  const longPausesPerMin: BenchmarkStatus =
    metrics.effectiveDurationSec <= 0
      ? 'unavailable'
      : metrics.pauseMetrics.longPausesPerMin <= b.maxLongPausesPerMin
        ? 'target'
        : metrics.pauseMetrics.longPausesPerMin <= 2.5
          ? 'near'
          : 'below';

  const midPausesPerMin: BenchmarkStatus =
    metrics.effectiveDurationSec <= 0
      ? 'unavailable'
      : metrics.pauseMetrics.midPausesPerMin <= b.maxMidPausesPerMin
        ? 'target'
        : metrics.pauseMetrics.midPausesPerMin <= 6
          ? 'near'
          : 'below';

  const meanRunLength: BenchmarkStatus =
    metrics.wordCount <= 0
      ? 'unavailable'
      : metrics.pauseMetrics.meanRunLength >= b.minMeanRunLength
        ? 'target'
        : metrics.pauseMetrics.meanRunLength >= 5
          ? 'near'
          : 'below';

  const startLatencySec: BenchmarkStatus =
    metrics.pauseMetrics.startLatencySec === null
      ? 'unavailable'
      : metrics.pauseMetrics.startLatencySec <= b.maxStartLatencySec
        ? 'target'
        : metrics.pauseMetrics.startLatencySec <= 3.0
          ? 'near'
          : 'below';

  const fillersPerMin: BenchmarkStatus =
    metrics.effectiveDurationSec <= 0
      ? 'unavailable'
      : metrics.fillersPerMin <= b.maxFillersPerMin
        ? 'target'
        : metrics.fillersPerMin <= 7
          ? 'near'
          : 'below';

  const mattr: BenchmarkStatus =
    metrics.wordCount < 20
      ? 'unavailable'
      : metrics.lexicalDiversity.mattr >= b.minMattr
        ? 'target'
        : metrics.lexicalDiversity.mattr >= 0.45
          ? 'near'
          : 'below';

  return {
    wpm,
    longPausesPerMin,
    midPausesPerMin,
    meanRunLength,
    startLatencySec,
    fillersPerMin,
    mattr,
  };
}

/**
 * Convert SpeechMetrics into the SpeakingMetricsInput shape consumed by core/grading/packet.ts.
 */
export function toGradingSpeakingMetrics(
  metrics: SpeechMetrics,
  extra?: { part2DurationSec?: number; medianStartLatencySec?: number },
): SpeakingMetricsInput {
  return {
    wpm: metrics.wpm,
    longPausesPerMin: metrics.pauseMetrics.longPausesPerMin,
    midPausesPerMin: metrics.pauseMetrics.midPausesPerMin,
    meanRunLength: metrics.pauseMetrics.meanRunLength,
    medianStartLatencySec:
      extra?.medianStartLatencySec ??
      (metrics.pauseMetrics.startLatencySec ?? undefined),
    fillersPerMin: metrics.fillersPerMin,
    part2DurationSec: extra?.part2DurationSec,
    mattr: metrics.lexicalDiversity.mattr,
  };
}

/**
 * Convert SpeechMetrics into the RecordingRecord['metrics'] shape stored in Dexie.
 */
export function toRecordingMetrics(
  metrics: SpeechMetrics,
): NonNullable<RecordingRecord['metrics']> {
  return {
    wpm: metrics.wpm,
    pausesOver1s: metrics.pauseMetrics.pausesOver1s,
    pausesOver2s: metrics.pauseMetrics.longPauseCount,
    avgRunLength: metrics.pauseMetrics.meanRunLength,
    fillerCount: metrics.fillerCount,
  };
}

export interface SpeakingTurnMetricsInput {
  part: '1' | '2' | '3';
  transcript: string;
  durationSec: number;
  vadSummary?: VadSummary | null;
  asrSegments?: ReadonlyArray<Pick<AsrTranscriptSegment, 'text' | 'confidence'>>;
}

/**
 * Aggregate multiple Speaking turns (e.g., full Mock Examiner session) into session-level metrics
 * including median start latency and Part 2 duration.
 */
export function aggregateTurnMetrics(turns: ReadonlyArray<SpeakingTurnMetricsInput>): {
  combined: SpeechMetrics;
  medianStartLatencySec: number | null;
  part2DurationSec: number | undefined;
  gradingMetrics: SpeakingMetricsInput;
} {
  const combinedTranscript = turns.map((t) => t.transcript.trim()).filter(Boolean).join(' ');
  const combinedSegments = turns.flatMap((t) => t.asrSegments ?? []);

  let totalActiveSec = 0;
  let totalSpeechSec = 0;
  let totalSilenceSec = 0;
  let totalDurationSec = 0;
  let pauseCount = 0;
  let midPauseCount = 0;
  let longPauseCount = 0;
  let longestPauseSec = 0;
  const latencies: number[] = [];

  for (const turn of turns) {
    const v = turn.vadSummary;
    if (v) {
      totalActiveSec += v.activeDurationSec > 0 ? v.activeDurationSec : turn.durationSec;
      totalSpeechSec += v.speechDurationSec;
      totalSilenceSec += v.silenceDurationSec;
      totalDurationSec += v.totalDurationSec > 0 ? v.totalDurationSec : turn.durationSec;
      pauseCount += v.pauseCount;
      midPauseCount += v.midPauseCount;
      longPauseCount += v.longPauseCount;
      if (v.longestPauseSec > longestPauseSec) longestPauseSec = v.longestPauseSec;
      if (v.startLatencySec !== null) latencies.push(v.startLatencySec);
    } else {
      totalActiveSec += Math.max(0, turn.durationSec);
      totalSpeechSec += Math.max(0, turn.durationSec);
      totalDurationSec += Math.max(0, turn.durationSec);
    }
  }

  latencies.sort((a, b) => a - b);
  let medianStartLatencySec: number | null = null;
  if (latencies.length > 0) {
    const mid = Math.floor(latencies.length / 2);
    medianStartLatencySec =
      latencies.length % 2 === 1
        ? latencies[mid]
        : round((latencies[mid - 1] + latencies[mid]) / 2, 3);
  }

  const part2Turns = turns.filter((t) => t.part === '2');
  const part2DurationSec =
    part2Turns.length > 0
      ? round(
          part2Turns.reduce(
            (acc, t) =>
              acc +
              (t.vadSummary && t.vadSummary.activeDurationSec > 0
                ? t.vadSummary.activeDurationSec
                : Math.max(0, t.durationSec)),
            0,
          ),
          1,
        )
      : undefined;

  const syntheticSummary: VadSummary = {
    totalDurationSec: round(totalDurationSec, 3),
    activeDurationSec: round(totalActiveSec, 3),
    speechDurationSec: round(totalSpeechSec, 3),
    silenceDurationSec: round(totalSilenceSec, 3),
    internalSilenceDurationSec: round(totalSilenceSec, 3),
    silenceRatio: totalDurationSec > 0 ? round(totalSilenceSec / totalDurationSec, 3) : 0,
    startLatencySec: medianStartLatencySec,
    pauseCount,
    midPauseCount,
    longPauseCount,
    pausesOver1s: midPauseCount + longPauseCount,
    longestPauseSec: round(longestPauseSec, 3),
    noiseFloorRms: 0,
    noiseFloorDbfs: -100,
    thresholdRms: 0.015,
    calibrated: true,
    noisyEnvironment: false,
    segments: [],
    internalPauses: [],
  };

  const combined = computeSpeechMetrics({
    transcript: combinedTranscript,
    durationSec: totalActiveSec,
    vadSummary: syntheticSummary,
    startLatencySec: medianStartLatencySec,
    asrSegments: combinedSegments,
  });

  const gradingMetrics = toGradingSpeakingMetrics(combined, {
    part2DurationSec,
    medianStartLatencySec: medianStartLatencySec ?? undefined,
  });

  return {
    combined,
    medianStartLatencySec,
    part2DurationSec,
    gradingMetrics,
  };
}
